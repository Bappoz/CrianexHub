import { describe, it, expect } from 'vitest';
import {
  issueContactToken,
  verifyContactToken,
  CONTACT_TOKEN_TTL_MS,
} from './contact-token.js';

describe('contact-token', () => {
  it('emite e verifica um token válido', () => {
    const iat = Date.now();
    const token = issueContactToken(iat);
    const v = verifyContactToken(token, iat + 5000);
    expect(v.valid).toBe(true);
    if (v.valid) {
      expect(v.issuedAt).toBe(iat);
      expect(v.elapsedMs).toBe(5000);
    }
  });

  it('rejeita assinatura adulterada', () => {
    const token = issueContactToken();
    const tampered = token.slice(0, -3) + 'aaa';
    const v = verifyContactToken(tampered);
    expect(v.valid).toBe(false);
    if (!v.valid) expect(v.reason).toBe('bad_signature');
  });

  it('rejeita payload adulterado (assinatura não bate)', () => {
    const iat = Date.now();
    const token = issueContactToken(iat);
    const forged = Buffer.from(String(iat + 1)).toString('base64url') + '.' + token.split('.')[1];
    const v = verifyContactToken(forged);
    expect(v.valid).toBe(false);
  });

  it('rejeita token malformado', () => {
    expect(verifyContactToken('').valid).toBe(false);
    expect(verifyContactToken('semponto').valid).toBe(false);
    expect(verifyContactToken(null).valid).toBe(false);
    expect(verifyContactToken(123 as unknown).valid).toBe(false);
  });

  it('rejeita token expirado', () => {
    const iat = Date.now();
    const token = issueContactToken(iat);
    const v = verifyContactToken(token, iat + CONTACT_TOKEN_TTL_MS + 1000);
    expect(v.valid).toBe(false);
    if (!v.valid) expect(v.reason).toBe('expired');
  });

  it('rejeita token do futuro além da tolerância de relógio', () => {
    const iat = Date.now();
    const token = issueContactToken(iat);
    const v = verifyContactToken(token, iat - 120_000);
    expect(v.valid).toBe(false);
    if (!v.valid) expect(v.reason).toBe('future');
  });
});
