use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

/// Erro da aplicação com mapeamento direto para status HTTP + corpo JSON.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("não autorizado: {0}")]
    Unauthorized(String),
    #[error("acesso negado: {0}")]
    Forbidden(String),
    #[error("requisição inválida: {0}")]
    BadRequest(String),
    #[error("não encontrado")]
    NotFound,
    #[error(transparent)]
    Db(#[from] sqlx::Error),
    #[error("erro interno: {0}")]
    Internal(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, msg) = match &self {
            AppError::Unauthorized(m) => (StatusCode::UNAUTHORIZED, m.clone()),
            AppError::Forbidden(m) => (StatusCode::FORBIDDEN, m.clone()),
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, m.clone()),
            AppError::NotFound => (StatusCode::NOT_FOUND, "não encontrado".to_string()),
            AppError::Db(e) => {
                tracing::error!(error = %e, "erro de banco");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "erro ao acessar o banco".to_string(),
                )
            }
            AppError::Internal(m) => {
                tracing::error!(error = %m, "erro interno");
                (StatusCode::INTERNAL_SERVER_ERROR, "erro interno".to_string())
            }
        };
        (status, Json(json!({ "error": msg }))).into_response()
    }
}
