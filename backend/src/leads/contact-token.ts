import { createHmac, timingSafeEqual } from 'crypto';

// Token anti-bot invisível: o frontend busca um token em GET /public/contact/token
// ao abrir o formulário e o devolve no POST. O token carrega o instante de emissão
// assinado por HMAC — o que dá (a) prova de que o envio veio de uma sessão de
// formulário real (barra replay/scripts direto na API) e (b) o tempo de
// preenchimento (o lead-scoring usa isso como sinal de "rápido demais").
// Sem cookie, sem estado no servidor, sem serviço de terceiros.

const SECRET =
  process.env['CONTACT_TOKEN_SECRET'] ?? process.env['JWT_SECRET'] ?? 'dev-contact-token-secret';

// TTL generoso: o formulário pode ficar aberto um bom tempo antes do envio.
export const CONTACT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2h
// Tolerância a diferença de relógio cliente/servidor.
const CLOCK_SKEW_MS = 60_000;

export type TokenVerification =
  | { valid: true; issuedAt: number; elapsedMs: number }
  | { valid: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'future' };

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function issueContactToken(issuedAt: number = Date.now()): string {
  const payload = String(issuedAt);
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(payload)}`;
}

export function verifyContactToken(token: unknown, now: number = Date.now()): TokenVerification {
  if (typeof token !== 'string' || !token) return { valid: false, reason: 'malformed' };

  const dot = token.indexOf('.');
  if (dot === -1) return { valid: false, reason: 'malformed' };

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return { valid: false, reason: 'malformed' };

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad_signature' };
  }

  const elapsedMs = now - issuedAt;
  if (elapsedMs < -CLOCK_SKEW_MS) return { valid: false, reason: 'future' };
  if (elapsedMs > CONTACT_TOKEN_TTL_MS) return { valid: false, reason: 'expired' };

  return { valid: true, issuedAt, elapsedMs: Math.max(0, elapsedMs) };
}
