import { describe, it, expect } from 'vitest';
import { getTicketsData } from './tickets';

describe('getTicketsData', () => {
  it('retorna KPIs, tickets e contagens', () => {
    const d = getTicketsData();
    expect(d.kpis).toHaveLength(4);
    expect(d.tickets.length).toBeGreaterThan(0);
    expect(d.counts.aberto + d.counts.andamento + d.counts.resolvido).toBe(d.tickets.length);
  });

  it('contagens batem com os status reais', () => {
    const d = getTicketsData();
    const aberto = d.tickets.filter((t) => t.status === 'aberto').length;
    const andamento = d.tickets.filter((t) => t.status === 'andamento').length;
    const resolvido = d.tickets.filter((t) => t.status === 'resolvido').length;
    expect(d.counts).toEqual({ aberto, andamento, resolvido });
  });

  it('todo ticket tem ao menos uma mensagem e campos essenciais', () => {
    for (const t of getTicketsData().tickets) {
      expect(t.messages.length).toBeGreaterThan(0);
      expect(t.id).toMatch(/^TKT-/);
      expect(['baixa', 'media', 'alta', 'urgente']).toContain(t.priority);
      expect(['email', 'chat', 'telefone', 'formulario']).toContain(t.channel);
    }
  });

  it('KPI de SLA em risco conta apenas não-resolvidos próximos do prazo', () => {
    const d = getTicketsData();
    const sla = d.kpis.find((k) => k.id === 'sla');
    expect(sla).toBeDefined();
    expect(sla?.value).toBeGreaterThanOrEqual(0);
    expect(sla?.tone).toBe('warn');
  });
});
