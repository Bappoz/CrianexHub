use std::sync::Arc;

use axum::extract::{FromRef, FromRequestParts};
use axum::http::header::{AUTHORIZATION, COOKIE};
use axum::http::request::Parts;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use uuid::Uuid;

use crate::config::{AuthMode, Config};
use crate::error::AppError;

/// Identidade do usuário admin autenticado.
#[derive(Debug, Clone)]
pub struct Viewer {
    pub id: Uuid,
    pub role: String,
}

impl Viewer {
    pub fn is_owner(&self) -> bool {
        self.role == "owner"
    }
}

#[derive(Debug, Deserialize)]
struct AppMetadata {
    #[serde(default)]
    role: Option<String>,
}

/// Extrai o token do header `Authorization: Bearer` ou dos cookies de sessão
/// (`crianex_admin_access_token` do fluxo SvelteKit, ou `access_token`).
fn extract_token(parts: &Parts) -> Option<String> {
    if let Some(h) = parts.headers.get(AUTHORIZATION).and_then(|v| v.to_str().ok()) {
        if let Some(t) = h.strip_prefix("Bearer ") {
            return Some(t.trim().to_string());
        }
    }
    let cookie = parts.headers.get(COOKIE).and_then(|v| v.to_str().ok())?;
    for pair in cookie.split(';') {
        let pair = pair.trim();
        for name in ["crianex_admin_access_token", "access_token"] {
            if let Some(v) = pair.strip_prefix(&format!("{name}=")) {
                return Some(v.trim().to_string());
            }
        }
    }
    None
}

// ── Modo HS256 (dev/testes com tokens próprios) ──────────────────────────────
#[derive(Debug, Deserialize)]
struct HsClaims {
    sub: String,
    #[serde(default)]
    app_metadata: Option<AppMetadata>,
}

fn validate_hs256(token: &str, secret: &str) -> Result<Viewer, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_aud = false;
    let data = decode::<HsClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|e| AppError::Unauthorized(format!("token inválido: {e}")))?;
    let id = Uuid::parse_str(&data.claims.sub)
        .map_err(|_| AppError::Unauthorized("sub inválido".into()))?;
    let role = data
        .claims
        .app_metadata
        .and_then(|m| m.role)
        .unwrap_or_else(|| "member".into());
    Ok(Viewer { id, role })
}

// ── Modo Supabase (valida via API, igual ao Express) ─────────────────────────
#[derive(Debug, Deserialize)]
struct SupabaseUser {
    id: String,
    #[serde(default)]
    app_metadata: Option<AppMetadata>,
}

async fn validate_supabase(
    http: &reqwest::Client,
    url: &str,
    key: &str,
    token: &str,
) -> Result<Viewer, AppError> {
    let resp = http
        .get(format!("{}/auth/v1/user", url.trim_end_matches('/')))
        .header("apikey", key)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| AppError::Unauthorized(format!("falha ao contatar o Supabase: {e}")))?;
    if !resp.status().is_success() {
        return Err(AppError::Unauthorized("token rejeitado pelo Supabase".into()));
    }
    let user: SupabaseUser = resp
        .json()
        .await
        .map_err(|e| AppError::Unauthorized(format!("resposta de usuário inválida: {e}")))?;
    let id =
        Uuid::parse_str(&user.id).map_err(|_| AppError::Unauthorized("id inválido".into()))?;
    let role = user
        .app_metadata
        .and_then(|m| m.role)
        .unwrap_or_else(|| "member".into());
    Ok(Viewer { id, role })
}

impl<S> FromRequestParts<S> for Viewer
where
    S: Send + Sync,
    Arc<Config>: FromRef<S>,
    reqwest::Client: FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let config = Arc::<Config>::from_ref(state);
        let token =
            extract_token(parts).ok_or_else(|| AppError::Unauthorized("token ausente".into()))?;
        match config.auth_mode {
            AuthMode::Hs256 => validate_hs256(&token, &config.jwt_secret),
            AuthMode::Supabase => {
                let http = reqwest::Client::from_ref(state);
                validate_supabase(&http, &config.supabase_url, &config.supabase_key, &token).await
            }
        }
    }
}

/// Guarda para POST /events: exige `X-Ingest-Secret` (server-to-server, RN13).
pub struct IngestGuard;

impl<S> FromRequestParts<S> for IngestGuard
where
    S: Send + Sync,
    Arc<Config>: FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let config = Arc::<Config>::from_ref(state);
        let provided = parts
            .headers
            .get("x-ingest-secret")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        if constant_time_eq(provided.as_bytes(), config.ingest_secret.as_bytes()) {
            Ok(IngestGuard)
        } else {
            Err(AppError::Unauthorized("segredo de ingestão inválido".into()))
        }
    }
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}
