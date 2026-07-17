import { describe, it, expect } from 'vitest';
import { getFinanceData, RANGES, type Range } from './finance';

describe('getFinanceData', () => {
  it('retorna o contrato completo para cada range', () => {
    for (const { id } of RANGES) {
      const f = getFinanceData(id);
      expect(f.range).toBe(id);
      expect(f.kpis).toHaveLength(4);
      expect(f.revenue).toHaveLength(12);
      expect(f.mrrMovement.length).toBeGreaterThan(0);
      expect(f.plans.length).toBeGreaterThan(0);
      expect(f.payMethods.length).toBeGreaterThan(0);
      expect(f.invoices.length).toBeGreaterThan(0);
    }
  });

  it('mrrNet é a soma dos movimentos', () => {
    const f = getFinanceData('30d');
    const sum = f.mrrMovement.reduce((a, m) => a + m.value, 0);
    expect(f.mrrNet).toBe(sum);
  });

  it('totais são coerentes com revenue e invoices', () => {
    const f = getFinanceData('30d');
    const recebido = f.revenue.reduce((a, m) => a + m.recebido, 0);
    const vencido = f.invoices
      .filter((i) => i.status === 'vencida')
      .reduce((a, i) => a + i.valor, 0);
    expect(f.totals.recebido).toBe(recebido);
    expect(f.totals.vencido).toBe(vencido);
  });

  it('faturas vencidas têm vencimento no passado', () => {
    const now = Date.now();
    for (const inv of getFinanceData('30d').invoices) {
      if (inv.status === 'vencida') {
        expect(new Date(inv.vencimento).getTime()).toBeLessThan(now);
      }
    }
  });

  it('é determinístico', () => {
    const a = getFinanceData('90d');
    const b = getFinanceData('90d');
    expect(a.kpis.map((k) => k.value)).toEqual(b.kpis.map((k) => k.value));
    expect(a.revenue.map((m) => m.recebido)).toEqual(b.revenue.map((m) => m.recebido));
  });

  it('fallback para 30d em range inválido', () => {
    expect(getFinanceData('zzz' as Range).periodLabel).toBe('últimos 30 dias');
  });

  it('todos os valores monetários são finitos e não-negativos onde esperado', () => {
    const f = getFinanceData('12m');
    for (const m of f.revenue) {
      expect(m.recebido).toBeGreaterThanOrEqual(0);
      expect(m.aReceber).toBeGreaterThanOrEqual(0);
    }
    for (const inv of f.invoices) expect(inv.valor).toBeGreaterThan(0);
  });
});
