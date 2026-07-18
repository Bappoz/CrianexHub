use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub tipo: String,
    pub conteudo: String,
    pub status: String,
    pub member_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

/// Corpo de POST /events — ingestão server-to-server (Express).
#[derive(Debug, Deserialize)]
pub struct CreateEvent {
    pub tipo: String,
    pub conteudo: String,
    #[serde(default)]
    pub member_id: Option<Uuid>,
}

/// Corpo de PATCH /notifications/{id}.
#[derive(Debug, Deserialize)]
pub struct UpdateStatus {
    pub status: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Template {
    pub id: Uuid,
    pub tipo_evento: String,
    pub nome: String,
    pub conteudo: String,
    pub is_default: bool,
    pub active: bool,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Corpo de POST /templates.
#[derive(Debug, Deserialize)]
pub struct CreateTemplate {
    pub tipo_evento: String,
    pub nome: String,
    pub conteudo: String,
    #[serde(default)]
    pub color: Option<String>,
}

/// Corpo de PATCH /templates/{id} — todos opcionais.
#[derive(Debug, Deserialize)]
pub struct UpdateTemplate {
    pub nome: Option<String>,
    pub conteudo: Option<String>,
    pub color: Option<String>,
    pub active: Option<bool>,
}
