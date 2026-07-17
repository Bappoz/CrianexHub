import { describe, it, expect } from 'vitest';
import { getProductLogsData, ACTION_META, type LogAction } from './product-logs';

describe('getProductLogsData', () => {
  it('retorna logs com summary coerente', () => {
    const d = getProductLogsData();
    expect(d.logs.length).toBeGreaterThan(0);
    expect(d.summary.total).toBe(d.logs.length);
    const afetados = new Set(d.logs.map((l) => l.productId)).size;
    expect(d.summary.produtosAfetados).toBe(afetados);
    expect(d.summary.publicacoes).toBe(d.logs.filter((l) => l.action === 'publicacao').length);
  });

  it('todo log tem id único e ação válida', () => {
    const d = getProductLogsData();
    const ids = new Set(d.logs.map((l) => l.id));
    expect(ids.size).toBe(d.logs.length);
    const valid = Object.keys(ACTION_META) as LogAction[];
    for (const l of d.logs) expect(valid).toContain(l.action);
  });

  it('mudanças de preço e edição possuem diff; criação/exclusão podem ser vazias', () => {
    const d = getProductLogsData();
    for (const l of d.logs) {
      if (l.action === 'preco' || l.action === 'edicao') {
        expect(l.changes.length).toBeGreaterThan(0);
      }
    }
  });

  it('logs vêm ordenados do mais recente para o mais antigo', () => {
    const times = getProductLogsData().logs.map((l) => new Date(l.at).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!).toBeLessThanOrEqual(times[i - 1]!);
    }
  });
});
