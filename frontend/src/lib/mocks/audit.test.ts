import { describe, it, expect } from 'vitest';
import { getAuditData, CATEGORY_META, RESULT_META, type AuditCategory } from './audit';

describe('getAuditData', () => {
  it('retorna eventos e summary coerente', () => {
    const d = getAuditData();
    expect(d.events.length).toBeGreaterThan(0);
    expect(d.summary.total).toBe(d.events.length);
    expect(d.summary.negados).toBe(d.events.filter((e) => e.result === 'negado').length);
  });

  it('todo evento tem categoria e resultado válidos e id único', () => {
    const d = getAuditData();
    const ids = new Set(d.events.map((e) => e.id));
    expect(ids.size).toBe(d.events.length);
    const cats = Object.keys(CATEGORY_META) as AuditCategory[];
    for (const e of d.events) {
      expect(cats).toContain(e.category);
      expect(Object.keys(RESULT_META)).toContain(e.result);
      expect(e.ip).toMatch(/\d+\.\d+\.\d+\.\d+/);
    }
  });

  it('eventos ordenados do mais recente para o mais antigo', () => {
    const times = getAuditData().events.map((e) => new Date(e.at).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!).toBeLessThanOrEqual(times[i - 1]!);
    }
  });

  it('registra ao menos uma tentativa negada (segurança)', () => {
    expect(getAuditData().summary.negados).toBeGreaterThan(0);
  });
});
