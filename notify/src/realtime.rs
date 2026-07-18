use std::time::Duration;

use sqlx::postgres::PgListener;
use tokio::sync::broadcast;

use crate::models::Notification;

/// Canal de broadcast que fan-out as notificações novas para todos os clientes SSE.
pub fn channel() -> broadcast::Sender<Notification> {
    broadcast::channel(256).0
}

/// Ouve o canal Postgres `crianex_notifications` (emitido pelo trigger de INSERT)
/// e reenvia cada notificação nova para o broadcast. Reconecta em caso de falha.
pub fn spawn_listener(database_url: String, tx: broadcast::Sender<Notification>) {
    tokio::spawn(async move {
        loop {
            if let Err(e) = run(&database_url, &tx).await {
                tracing::warn!(error = %e, "listener LISTEN/NOTIFY caiu; reconectando em 2s");
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    });
}

async fn run(url: &str, tx: &broadcast::Sender<Notification>) -> anyhow::Result<()> {
    let mut listener = PgListener::connect(url).await?;
    listener.listen("crianex_notifications").await?;
    tracing::info!("escutando canal Postgres crianex_notifications");
    loop {
        let msg = listener.recv().await?;
        match serde_json::from_str::<Notification>(msg.payload()) {
            // send falha só quando não há assinantes — ignoramos.
            Ok(n) => {
                let _ = tx.send(n);
            }
            Err(e) => tracing::warn!(error = %e, "payload de NOTIFY inválido"),
        }
    }
}
