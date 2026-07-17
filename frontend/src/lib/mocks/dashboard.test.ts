import { describe, it, expect } from 'vitest';
import { getDashboardData, RANGES, type Range } from './dashboard';

describe('getDashboardData', () => {
  it('retorna o contrato completo para cada range', () => {
    for (const { id } of RANGES) {
      const d = getDashboardData(id);
      expect(d.range).toBe(id);
      expect(d.kpis).toHaveLength(4);
      expect(d.funnel).toHaveLength(4);
      expect(d.sources.length).toBeGreaterThan(0);
      expect(d.topProducts.length).toBeGreaterThan(0);
      expect(d.activity.length).toBeGreaterThan(0);
      expect(d.system.length).toBeGreaterThan(0);
      expect(d.timeseries.length).toBeGreaterThan(0);
    }
  });

  it('respeita o número de pontos por range', () => {
    expect(getDashboardData('7d').timeseries).toHaveLength(7);
    expect(getDashboardData('12m').timeseries).toHaveLength(12);
  });

  it('é determinístico nos valores numéricos (seed estável)', () => {
    const a = getDashboardData('30d');
    const b = getDashboardData('30d');
    expect(a.kpis.map((k) => k.value)).toEqual(b.kpis.map((k) => k.value));
    expect(a.timeseries.map((p) => p.receita)).toEqual(b.timeseries.map((p) => p.receita));
    expect(a.kpis[0]?.series).toEqual(b.kpis[0]?.series);
  });

  it('funil é monotonicamente decrescente (capturados ≥ … ≥ fechados)', () => {
    const { funnel } = getDashboardData('30d');
    for (let i = 1; i < funnel.length; i++) {
      expect(funnel[i]!.value).toBeLessThanOrEqual(funnel[i - 1]!.value);
    }
  });

  it('origens de leads somam ~100%', () => {
    const total = getDashboardData('30d').sources.reduce((a, s) => a + s.value, 0);
    expect(total).toBe(100);
  });

  it('faz fallback para 30d em range inválido', () => {
    const d = getDashboardData('xx' as Range);
    expect(d.timeseries).toHaveLength(30);
  });

  it('todos os valores das séries são finitos e não-negativos', () => {
    const d = getDashboardData('90d');
    const all = [
      ...d.timeseries.map((p) => p.receita),
      ...d.timeseries.map((p) => p.leads),
      ...d.kpis.flatMap((k) => k.series),
    ];
    for (const v of all) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});
