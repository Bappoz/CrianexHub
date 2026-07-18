import { describe, it, expect } from 'vitest';
import {
  CHANNELS,
  buildPayload,
  resolveStatus,
  defaultForm,
  canAdvance,
  isValidEmail,
  STEP_COUNT,
} from './contact';

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
});

describe('isValidEmail', () => {
  it('accepts a well-formed email', () => {
    expect(isValidEmail('ana@empresa.com')).toBe(true);
  });
  it('rejects malformed', () => {
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
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

  it('omits company/phone/role when empty', () => {
    const payload = buildPayload({ ...base });
    expect(payload).not.toHaveProperty('company');
    expect(payload).not.toHaveProperty('phone');
    expect(payload).not.toHaveProperty('role');
  });

  it('includes phone and company when filled', () => {
    const payload = buildPayload({ ...base, phone: '+55 11 90000-0000', company: 'Acme' });
    expect(payload.phone).toBe('+55 11 90000-0000');
    expect(payload.company).toBe('Acme');
  });

  it('maps role enum to a cargo label containing the senior term', () => {
    expect(String(buildPayload({ ...base, role: 'founder' }).role)).toMatch(/Fundador/);
    expect(String(buildPayload({ ...base, role: 'manager' }).role)).toMatch(/Gestor/);
  });

  it('nests qualification only with non-empty answers', () => {
    expect(buildPayload({ ...base })).not.toHaveProperty('qualification');
    const q = buildPayload({ ...base, teamSize: 'medium', timeline: 'now' }).qualification as Record<
      string,
      string
    >;
    expect(q).toEqual({ teamSize: 'medium', timeline: 'now' });
  });

  it('omits product_interest when product is "other" or empty', () => {
    expect(buildPayload({ ...base, product: 'other' })).not.toHaveProperty('product_interest');
    expect(buildPayload({ ...base, product: '' })).not.toHaveProperty('product_interest');
  });
});

describe('canAdvance', () => {
  const base = defaultForm();

  it('step 0 requires name + valid email', () => {
    expect(canAdvance(0, base)).toBe(false);
    expect(canAdvance(0, { ...base, name: 'Ana', email: 'bad' })).toBe(false);
    expect(canAdvance(0, { ...base, name: 'Ana', email: 'ana@co.com' })).toBe(true);
  });

  it('qualification steps (1-3) are optional', () => {
    expect(canAdvance(1, base)).toBe(true);
    expect(canAdvance(2, base)).toBe(true);
    expect(canAdvance(3, base)).toBe(true);
  });

  it('step 4 requires a message', () => {
    expect(canAdvance(4, base)).toBe(false);
    expect(canAdvance(4, { ...base, message: 'Preciso de ajuda' })).toBe(true);
  });

  it('final step requires consent', () => {
    expect(canAdvance(STEP_COUNT - 1, base)).toBe(false);
    expect(canAdvance(STEP_COUNT - 1, { ...base, consent: true })).toBe(true);
  });
});

describe('resolveStatus', () => {
  it('success for 201/200', () => {
    expect(resolveStatus(201).status).toBe('success');
    expect(resolveStatus(200).status).toBe('success');
  });
  it('rate key for 429', () => {
    expect(resolveStatus(429).errorKey).toBe('rate');
  });
  it('token key for 403', () => {
    expect(resolveStatus(403).errorKey).toBe('token');
  });
  it('generic key for 422/500', () => {
    expect(resolveStatus(422).errorKey).toBe('generic');
    expect(resolveStatus(500).errorKey).toBe('generic');
  });
});

describe('defaultForm', () => {
  it('resets to clean state', () => {
    const form = defaultForm();
    expect(form.name).toBe('');
    expect(form.product).toBe('');
    expect(form.consent).toBe(false);
    expect(form.website).toBe('');
  });
  it('returns a fresh object each call', () => {
    const a = defaultForm();
    const b = defaultForm();
    a.name = 'changed';
    expect(b.name).toBe('');
  });
});
