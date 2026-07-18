// Cliente fino para o microserviço de notificações (crianex-notify).
// Substitui a criação direta no banco: agora todo evento passa pelo serviço
// (POST /events, server-to-server via segredo de ingestão — mantém RN13).
// Best-effort: se o serviço estiver indisponível, loga e NÃO derruba a operação
// de negócio que originou o evento.

const NOTIFY_BASE_URL = process.env['NOTIFY_BASE_URL'] ?? 'http://localhost:3100';
const INGEST_SECRET = process.env['NOTIFY_INGEST_SECRET'] ?? 'dev-ingest-secret';

export async function createNotification(input: {
  tipo: string;
  conteudo: string;
  memberId?: string | null;
}): Promise<void> {
  try {
    const res = await fetch(`${NOTIFY_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ingest-secret': INGEST_SECRET,
      },
      body: JSON.stringify({
        tipo: input.tipo,
        conteudo: input.conteudo,
        member_id: input.memberId ?? null,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[notify] evento rejeitado (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error('[notify] falha ao enviar evento:', err);
  }
}
