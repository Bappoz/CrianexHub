// ─────────────────────────────────────────────────────────────────────────────
// Mock de dados do módulo Financeiro. Mesmo contrato-por-função do dashboard:
// `getFinanceData(range)` devolve tudo que a página consome, com geração
// determinística (seed) e pronto para trocar por dados reais.
// ─────────────────────────────────────────────────────────────────────────────

import { RANGES, type Range } from './dashboard';
import type { Kpi } from './dashboard';

export { RANGES };
export type { Range };

export interface MonthRevenue {
  month: string;
  recebido: number;
  aReceber: number;
}

export interface MrrMove {
  label: string;
  value: number; // positivo = entra, negativo = sai
}

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export type InvoiceStatus = 'paga' | 'pendente' | 'vencida';

export interface Invoice {
  id: string;
  cliente: string;
  plano: string;
  valor: number;
  vencimento: string; // ISO
  status: InvoiceStatus;
}

export interface FinanceData {
  range: Range;
  rangeLabel: string;
  periodLabel: string;
  updatedAt: string;
  kpis: Kpi[];
  revenue: MonthRevenue[];
  mrrMovement: MrrMove[];
  mrrNet: number;
  plans: Slice[];
  payMethods: Slice[];
  invoices: Invoice[];
  totals: { recebido: number; aReceber: number; vencido: number };
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function trend(n: number, base: number, growth: number, noise: number, seed: number): number[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = base * (1 + (growth * i) / n);
    return Math.max(0, Math.round(t * (1 + (r() - 0.5) * noise)));
  });
}

function pctChange(series: number[]): number {
  if (series.length < 2) return 0;
  const h = Math.floor(series.length / 2);
  const prev = series.slice(0, h).reduce((a, b) => a + b, 0) / h || 1;
  const curr = series.slice(h).reduce((a, b) => a + b, 0) / (series.length - h) || 1;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const SCALE: Record<Range, { scale: number; period: string; seed: number }> = {
  '7d': { scale: 0.24, period: 'últimos 7 dias', seed: 7 },
  '30d': { scale: 1, period: 'últimos 30 dias', seed: 30 },
  '90d': { scale: 3.05, period: 'últimos 90 dias', seed: 90 },
  '12m': { scale: 12.4, period: 'últimos 12 meses', seed: 12 },
};

const CLIENTES = [
  ['Vitalis Saúde', 'Business'],
  ['NovaEdu', 'Pro'],
  ['Grupo Aurora', 'Enterprise'],
  ['Loja Bem-Estar', 'Starter'],
  ['Techno BR', 'Pro'],
  ['Clínica Viver', 'Business'],
  ['Móveis Duarte', 'Starter'],
  ['Agência Norte', 'Pro'],
  ['FinanPlus', 'Enterprise'],
];

export function getFinanceData(range: Range): FinanceData {
  const cfg = SCALE[range] ?? SCALE['30d'];
  const { scale, seed } = cfg;

  // Receita mensal (sempre 12 meses — visão anual), recebido + a receber
  const nowMonth = new Date().getMonth();
  const recebidoSeries = trend(12, 28000, 0.55, 0.16, seed * 3);
  const revenue: MonthRevenue[] = recebidoSeries.map((recebido, i) => {
    const m = (nowMonth - (11 - i) + 12) % 12;
    const aReceber = Math.round(recebido * (0.08 + rng(seed * 5 + i)() * 0.1));
    return { month: MONTHS[m] ?? '', recebido, aReceber };
  });

  const receitaPeriodo = Math.round(9800 * scale);
  const mrr = 52800 + Math.round((scale - 1) * 300);
  const ticketMedio = 1290 + Math.round((scale - 1) * 8);
  const inadimplencia = Math.round((3.4 + rng(seed)() * 1.2) * 10) / 10;

  const kpis: Kpi[] = [
    {
      id: 'receita',
      label: 'Receita no período',
      value: receitaPeriodo,
      format: 'currency',
      deltaPct: pctChange(trend(16, receitaPeriodo * 0.7, 0.42, 0.14, seed * 13)),
      series: trend(16, receitaPeriodo * 0.7, 0.42, 0.14, seed * 13),
      hint: cfg.period,
    },
    {
      id: 'mrr',
      label: 'MRR',
      value: mrr,
      format: 'currency',
      deltaPct: pctChange(trend(16, mrr * 0.72, 0.4, 0.1, seed * 17)),
      series: trend(16, mrr * 0.72, 0.4, 0.1, seed * 17),
      hint: 'receita recorrente mensal',
    },
    {
      id: 'ticket',
      label: 'Ticket médio',
      value: ticketMedio,
      format: 'currency',
      deltaPct: pctChange(trend(16, ticketMedio * 0.9, 0.14, 0.12, seed * 19)),
      series: trend(16, ticketMedio * 0.9, 0.14, 0.12, seed * 19),
      hint: 'por assinatura ativa',
    },
    {
      id: 'inadimplencia',
      label: 'Inadimplência',
      value: inadimplencia,
      format: 'percent',
      deltaPct: pctChange(trend(16, 42, -0.1, 0.3, seed * 23)),
      series: trend(16, 42, -0.1, 0.3, seed * 23).map((v) => v / 10),
      hint: 'do faturamento em atraso',
      tone: 'warn',
    },
  ];

  const mrrMovement: MrrMove[] = [
    { label: 'Novos', value: Math.round(6200 * scale ** 0.4) },
    { label: 'Expansão', value: Math.round(3100 * scale ** 0.4) },
    { label: 'Contração', value: -Math.round(1400 * scale ** 0.4) },
    { label: 'Churn', value: -Math.round(2300 * scale ** 0.4) },
  ];
  const mrrNet = mrrMovement.reduce((a, m) => a + m.value, 0);

  const plans: Slice[] = [
    { label: 'Starter', value: 148, color: '#66df7a' },
    { label: 'Pro', value: 96, color: '#7f3fe5' },
    { label: 'Business', value: 41, color: '#e71f84' },
    { label: 'Enterprise', value: 12, color: '#f5a623' },
  ];

  const payMethods: Slice[] = [
    { label: 'Cartão de crédito', value: 58, color: '#7f3fe5' },
    { label: 'Pix', value: 27, color: '#66df7a' },
    { label: 'Boleto', value: 11, color: '#e71f84' },
    { label: 'Transferência', value: 4, color: '#6f6e78' },
  ];

  const day = 86_400_000;
  const now = Date.now();
  const rInv = rng(seed * 31);
  const statuses: InvoiceStatus[] = [
    'paga',
    'paga',
    'pendente',
    'vencida',
    'paga',
    'pendente',
    'paga',
    'vencida',
    'pendente',
  ];
  const invoices: Invoice[] = CLIENTES.map(([cliente, plano], i) => {
    const status = statuses[i] ?? 'paga';
    const offset =
      status === 'vencida' ? -(3 + Math.floor(rInv() * 12)) : Math.floor(rInv() * 20) - 5;
    return {
      id: `FAT-${2400 + i}`,
      cliente: cliente ?? '—',
      plano: plano ?? '—',
      valor: Math.round((490 + rInv() * 4200) / 10) * 10,
      vencimento: new Date(now + offset * day).toISOString(),
      status,
    };
  });

  const recebidoTotal = revenue.reduce((a, m) => a + m.recebido, 0);
  const aReceberTotal = revenue.reduce((a, m) => a + m.aReceber, 0);
  const vencido = invoices.filter((i) => i.status === 'vencida').reduce((a, i) => a + i.valor, 0);

  return {
    range,
    rangeLabel: RANGES.find((r) => r.id === range)?.label ?? '30 dias',
    periodLabel: cfg.period,
    updatedAt: new Date().toISOString(),
    kpis,
    revenue,
    mrrMovement,
    mrrNet,
    plans,
    payMethods,
    invoices,
    totals: { recebido: recebidoTotal, aReceber: aReceberTotal, vencido },
  };
}
