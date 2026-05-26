import { describe, it, expect } from 'vitest';
import { PRODUCTS, CHANNELS, buildPayload, resolveStatus, defaultForm } from './contact';

describe('PRODUCTS', () => {
  it('has all 6 expected products', () => {
    expect(PRODUCTS).toHaveLength(6);
  });

  it('contains the expected product ids', () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(ids).toEqual(['avali', 'pontua', 'notifly', 'trilho', 'atende', 'ledger']);
  });

  it('every product has pt and en category labels', () => {
    for (const p of PRODUCTS) {
      expect(p.cat.pt).toBeTruthy();
      expect(p.cat.en).toBeTruthy();
    }
  });
});

describe('CHANNELS', () => {
  it('has exactly 4 channels', () => {
    expect(CHANNELS).toHaveLength(4);
  });

  it('contains EMAIL, LINKEDIN, WHATSAPP, HORÁRIO keys', () => {
    const keys = CHANNELS.map((c) => c.k);
    expect(keys).toContain('EMAIL');
    expect(keys).toContain('LINKEDIN');
    expect(keys).toContain('WHATSAPP');
    expect(keys).toContain('HORÁRIO');
  });

  it('every channel has pt and en values', () => {
    for (const ch of CHANNELS) {
      expect(ch.v.pt).toBeTruthy();
      expect(ch.v.en).toBeTruthy();
    }
  });
});

describe('buildPayload', () => {
  const base = defaultForm();

  it('maps name, email, message, product, website', () => {
    const form = { ...base, name: 'Ana', email: 'ana@co.com', message: 'Olá', product: 'avali' };
    const payload = buildPayload(form);
    expect(payload.name).toBe('Ana');
    expect(payload.email).toBe('ana@co.com');
    expect(payload.message).toBe('Olá');
    expect(payload.product_interest).toBe('avali');
    expect(payload.website).toBe('');
  });

  it('omits company when empty', () => {
    const form = { ...base, company: '' };
    expect(buildPayload(form)).not.toHaveProperty('company');
  });

  it('includes company when filled', () => {
    const form = { ...base, company: 'Acme' };
    expect(buildPayload(form).company).toBe('Acme');
  });

  it('omits product_interest when product is "other"', () => {
    const form = { ...base, product: 'other' };
    expect(buildPayload(form)).not.toHaveProperty('product_interest');
  });

  it('includes product_interest for any named product', () => {
    for (const p of PRODUCTS) {
      const form = { ...base, product: p.id };
      expect(buildPayload(form).product_interest).toBe(p.id);
    }
  });
});

describe('resolveStatus', () => {
  it('returns success for 201', () => {
    const result = resolveStatus(201);
    expect(result.status).toBe('success');
    expect(result.errorKey).toBeNull();
  });

  it('returns success for 200 (honeypot silent accept)', () => {
    const result = resolveStatus(200);
    expect(result.status).toBe('success');
    expect(result.errorKey).toBeNull();
  });

  it('returns error with rate key for 429', () => {
    const result = resolveStatus(429);
    expect(result.status).toBe('error');
    expect(result.errorKey).toBe('rate');
  });

  it('returns error with generic key for 422', () => {
    const result = resolveStatus(422);
    expect(result.status).toBe('error');
    expect(result.errorKey).toBe('generic');
  });

  it('returns error with generic key for 500', () => {
    const result = resolveStatus(500);
    expect(result.status).toBe('error');
    expect(result.errorKey).toBe('generic');
  });
});

describe('defaultForm', () => {
  it('resets to clean state with avali as default product', () => {
    const form = defaultForm();
    expect(form.name).toBe('');
    expect(form.email).toBe('');
    expect(form.product).toBe('avali');
    expect(form.consent).toBe(false);
    expect(form.website).toBe('');
  });

  it('returns a new object each call (not shared reference)', () => {
    const a = defaultForm();
    const b = defaultForm();
    a.name = 'changed';
    expect(b.name).toBe('');
  });
});
