mod auth;
mod config;
mod db;
mod error;
mod models;
mod realtime;

use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::extract::{FromRef, Path, Query, State};
use axum::http::{header, HeaderName, HeaderValue, Method, StatusCode};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use futures::Stream;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
use tower_http::cors::CorsLayer;
use tracing_subscriber::EnvFilter;
use uuid::Uuid;

use auth::{IngestGuard, Viewer};
use error::{AppError, AppResult};
use models::Notification;

#[derive(Clone)]
struct AppState {
    pool: sqlx::PgPool,
    config: Arc<config::Config>,
    tx: broadcast::Sender<Notification>,
    http: reqwest::Client,
}

impl FromRef<AppState> for Arc<config::Config> {
    fn from_ref(state: &AppState) -> Self {
        state.config.clone()
    }
}

impl FromRef<AppState> for reqwest::Client {
    fn from_ref(state: &AppState) -> Self {
        state.http.clone()
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let config = config::Config::from_env()?;
    let port = config.port;
    let cors_origins = config.cors_origins.clone();
    let database_url = config.database_url.clone();

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    let tx = realtime::channel();
    realtime::spawn_listener(database_url, tx.clone());

    let state = AppState {
        pool,
        config: Arc::new(config),
        tx,
        http: reqwest::Client::new(),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/notifications", get(list_notifications))
        .route("/notifications/unread-count", get(unread_count))
        .route("/notifications/stream", get(stream))
        .route("/notifications/{id}", patch(patch_notification))
        .route("/events", post(post_event))
        .route("/templates", get(list_templates).post(create_template))
        .route(
            "/templates/{id}",
            patch(update_template).delete(delete_template),
        )
        .layer(build_cors(&cors_origins))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await?;
    tracing::info!(%addr, "crianex-notify ouvindo");
    axum::serve(listener, app).await?;
    Ok(())
}

fn build_cors(origins: &[String]) -> CorsLayer {
    let allowed: Vec<HeaderValue> = origins.iter().filter_map(|o| o.parse().ok()).collect();
    CorsLayer::new()
        .allow_origin(allowed)
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            HeaderName::from_static("x-ingest-secret"),
        ])
}

async fn health() -> &'static str {
    "ok"
}

// ── Notificações ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct ListQuery {
    status: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ListResponse {
    notifications: Vec<Notification>,
    unread_count: i64,
}

async fn list_notifications(
    State(st): State<AppState>,
    viewer: Viewer,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<ListResponse>> {
    let notifications = db::list_notifications(&st.pool, &viewer, q.status.as_deref()).await?;
    let unread_count = db::count_unread(&st.pool, &viewer).await?;
    Ok(Json(ListResponse {
        notifications,
        unread_count,
    }))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CountResponse {
    unread_count: i64,
}

async fn unread_count(State(st): State<AppState>, viewer: Viewer) -> AppResult<Json<CountResponse>> {
    let unread_count = db::count_unread(&st.pool, &viewer).await?;
    Ok(Json(CountResponse { unread_count }))
}

async fn patch_notification(
    State(st): State<AppState>,
    viewer: Viewer,
    Path(id): Path<Uuid>,
    Json(body): Json<models::UpdateStatus>,
) -> AppResult<Json<Notification>> {
    if body.status != "read" && body.status != "unread" {
        return Err(AppError::BadRequest("status deve ser 'read' ou 'unread'".into()));
    }
    let n = db::set_status(&st.pool, id, &body.status, &viewer)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(n))
}

async fn post_event(
    State(st): State<AppState>,
    _guard: IngestGuard,
    Json(body): Json<models::CreateEvent>,
) -> AppResult<(StatusCode, Json<Notification>)> {
    if body.tipo.trim().is_empty() || body.conteudo.trim().is_empty() {
        return Err(AppError::BadRequest("tipo e conteudo são obrigatórios".into()));
    }
    let n = db::create_notification(&st.pool, &body.tipo, &body.conteudo, body.member_id).await?;
    Ok((StatusCode::CREATED, Json(n)))
}

// SSE: push ao vivo de notificações novas, filtrando por visibilidade do viewer.
async fn stream(
    State(st): State<AppState>,
    viewer: Viewer,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = st.tx.subscribe();
    let v = viewer.clone();
    let s = BroadcastStream::new(rx).filter_map(move |res| {
        let n = res.ok()?;
        let visible = v.is_owner() || n.member_id.is_none() || n.member_id == Some(v.id);
        if !visible {
            return None;
        }
        Event::default().json_data(&n).ok().map(Ok)
    });
    Sse::new(s).keep_alive(KeepAlive::default())
}

// ── Templates (owner) ────────────────────────────────────────────────────────

fn require_owner(v: &Viewer) -> AppResult<()> {
    if v.is_owner() {
        Ok(())
    } else {
        Err(AppError::Forbidden("apenas owner pode gerenciar templates".into()))
    }
}

async fn list_templates(
    State(st): State<AppState>,
    viewer: Viewer,
) -> AppResult<Json<Vec<models::Template>>> {
    require_owner(&viewer)?;
    Ok(Json(db::list_templates(&st.pool).await?))
}

async fn create_template(
    State(st): State<AppState>,
    viewer: Viewer,
    Json(body): Json<models::CreateTemplate>,
) -> AppResult<(StatusCode, Json<models::Template>)> {
    require_owner(&viewer)?;
    if body.tipo_evento.trim().is_empty()
        || body.nome.trim().is_empty()
        || body.conteudo.trim().is_empty()
    {
        return Err(AppError::BadRequest(
            "tipo_evento, nome e conteudo são obrigatórios".into(),
        ));
    }
    let t = db::create_template(
        &st.pool,
        &body.tipo_evento,
        &body.nome,
        &body.conteudo,
        body.color.as_deref(),
    )
    .await?;
    Ok((StatusCode::CREATED, Json(t)))
}

async fn update_template(
    State(st): State<AppState>,
    viewer: Viewer,
    Path(id): Path<Uuid>,
    Json(body): Json<models::UpdateTemplate>,
) -> AppResult<Json<models::Template>> {
    require_owner(&viewer)?;
    let t = db::update_template(
        &st.pool,
        id,
        body.nome.as_deref(),
        body.conteudo.as_deref(),
        body.color.as_deref(),
        body.active,
    )
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(t))
}

async fn delete_template(
    State(st): State<AppState>,
    viewer: Viewer,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    require_owner(&viewer)?;
    db::delete_template(&st.pool, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
