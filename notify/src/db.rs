use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::Viewer;
use crate::error::{AppError, AppResult};
use crate::models::{Notification, Template};

const N_COLS: &str = "id, tipo, conteudo, status, member_id, created_at";
const T_COLS: &str =
    "id, tipo_evento, nome, conteudo, is_default, active, color, created_at, updated_at";

// ── Notificações ────────────────────────────────────────────────────────────
// Visibilidade num único SQL: para 'owner' o primeiro termo ($owner) é true e
// libera tudo; para 'member', filtra globais (member_id null) + as próprias.

pub async fn list_notifications(
    pool: &PgPool,
    viewer: &Viewer,
    status: Option<&str>,
) -> AppResult<Vec<Notification>> {
    let sql = format!(
        "select {N_COLS} from notifications \
         where ($1::bool or member_id is null or member_id = $2::uuid) \
           and ($3::text is null or status = $3) \
         order by created_at desc"
    );
    let rows = sqlx::query_as::<_, Notification>(&sql)
        .bind(viewer.is_owner())
        .bind(viewer.id)
        .bind(status)
        .fetch_all(pool)
        .await?;
    Ok(rows)
}

pub async fn count_unread(pool: &PgPool, viewer: &Viewer) -> AppResult<i64> {
    let n = sqlx::query_scalar::<_, i64>(
        "select count(*) from notifications \
         where status = 'unread' \
           and ($1::bool or member_id is null or member_id = $2::uuid)",
    )
    .bind(viewer.is_owner())
    .bind(viewer.id)
    .fetch_one(pool)
    .await?;
    Ok(n)
}

pub async fn create_notification(
    pool: &PgPool,
    tipo: &str,
    conteudo: &str,
    member_id: Option<Uuid>,
) -> AppResult<Notification> {
    let sql = format!(
        "insert into notifications (tipo, conteudo, member_id) values ($1, $2, $3) returning {N_COLS}"
    );
    let n = sqlx::query_as::<_, Notification>(&sql)
        .bind(tipo)
        .bind(conteudo)
        .bind(member_id)
        .fetch_one(pool)
        .await?;
    Ok(n)
}

pub async fn set_status(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    viewer: &Viewer,
) -> AppResult<Option<Notification>> {
    let sql = format!(
        "update notifications set status = $1 \
         where id = $2 and ($3::bool or member_id is null or member_id = $4::uuid) \
         returning {N_COLS}"
    );
    let n = sqlx::query_as::<_, Notification>(&sql)
        .bind(status)
        .bind(id)
        .bind(viewer.is_owner())
        .bind(viewer.id)
        .fetch_optional(pool)
        .await?;
    Ok(n)
}

// ── Templates (owner) ────────────────────────────────────────────────────────

pub async fn list_templates(pool: &PgPool) -> AppResult<Vec<Template>> {
    let sql = format!("select {T_COLS} from notification_templates order by is_default desc, tipo_evento");
    Ok(sqlx::query_as::<_, Template>(&sql).fetch_all(pool).await?)
}

pub async fn create_template(
    pool: &PgPool,
    tipo_evento: &str,
    nome: &str,
    conteudo: &str,
    color: Option<&str>,
) -> AppResult<Template> {
    // RF15: no máximo 1 template ativo por tipo_evento. Desativa o ativo anterior
    // (se houver) e insere o novo — atômico numa transação.
    let mut tx = pool.begin().await?;
    sqlx::query("update notification_templates set active = false where tipo_evento = $1 and active")
        .bind(tipo_evento)
        .execute(&mut *tx)
        .await?;
    let sql = format!(
        "insert into notification_templates (tipo_evento, nome, conteudo, color, active) \
         values ($1, $2, $3, $4, true) returning {T_COLS}"
    );
    let t = sqlx::query_as::<_, Template>(&sql)
        .bind(tipo_evento)
        .bind(nome)
        .bind(conteudo)
        .bind(color)
        .fetch_one(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(t)
}

pub async fn update_template(
    pool: &PgPool,
    id: Uuid,
    nome: Option<&str>,
    conteudo: Option<&str>,
    color: Option<&str>,
    active: Option<bool>,
) -> AppResult<Option<Template>> {
    let sql = format!(
        "update notification_templates set \
           nome = coalesce($1, nome), \
           conteudo = coalesce($2, conteudo), \
           color = coalesce($3, color), \
           active = coalesce($4, active) \
         where id = $5 returning {T_COLS}"
    );
    Ok(sqlx::query_as::<_, Template>(&sql)
        .bind(nome)
        .bind(conteudo)
        .bind(color)
        .bind(active)
        .bind(id)
        .fetch_optional(pool)
        .await?)
}

pub async fn delete_template(pool: &PgPool, id: Uuid) -> AppResult<()> {
    // O template de fallback (is_default) nunca pode ser removido (RF57).
    let res = sqlx::query("delete from notification_templates where id = $1 and is_default = false")
        .bind(id)
        .execute(pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
