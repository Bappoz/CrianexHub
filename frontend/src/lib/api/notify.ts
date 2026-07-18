import { env } from '$env/dynamic/public';

// Base do microserviço de notificações (crianex-notify).
export const NOTIFY_BASE = env.PUBLIC_NOTIFY_BASE_URL ?? 'http://localhost:3100';

type NotifyInit = RequestInit & { token?: string };

/**
 * Chama o crianex-notify. No servidor (load) passe `token` → header Bearer.
 * No cliente, omita `token` → o cookie de sessão vai via `credentials: include`
 * (mesmo site, o serviço lê o cookie `crianex_admin_access_token`).
 */
export async function notifyFetch<T>(path: string, init: NotifyInit = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const h: Record<string, string> = {
    'content-type': 'application/json',
    ...((headers as Record<string, string>) ?? {}),
  };
  if (token) h['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${NOTIFY_BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers: h,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(body || `notify ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
