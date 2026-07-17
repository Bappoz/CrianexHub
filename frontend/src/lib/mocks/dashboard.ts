// ─────────────────────────────────────────────────────────────────────────────
// Mock de dados do Dashboard administrativo.
//
// Estrutura pensada para trocar por dados reais (backend/Supabase) sem alterar a
// UI: `getDashboardData(range)` devolve o contrato completo consumido pela página.
// A geração é determinística (RNG com seed) — números variados mas estáveis entre
// requisições, evitando "piscar" valores a cada reload.
// ─────────────────────────────────────────────────────────────────────────────

export type Range = '7d' | '30d' | '90d' | '12m';

export const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: '12m', label: '12 meses' },
];

export type KpiFormat = 'currency' | 'number' | 'percent';

export interface Kpi {
  id: string;
  label: string;
  value: number;
  format: KpiFormat;
  /** Variação percentual vs. período anterior (pode ser negativa). */
  deltaPct: number;
  /** Série curta para o sparkline. */
  series: number[];
  /** Nota curta opcional (ex.: "3 fora do SLA"). */
  hint?: string;
  tone?: 'default' | 'warn';
}

export interface SeriesPoint {
  t: string;
  receita: number;
  leads: number;
}

export interface FunnelStage {
  label: string;
  value: number;
}

export interface SourceSlice {
  label: string;
  value: number;
  color: string;
}

export interface TopProduct {
  name: string;
  views: number;
  trendPct: number;
}

export type ActivityKind = 'lead' | 'product' | 'member' | 'faq' | 'ticket' | 'system';

export interface Activity {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string; // ISO
  kind: ActivityKind;
}

export interface SystemStatus {
  label: string;
  status: 'ok' | 'warn' | 'down';
  detail: string;
}

export interface DashboardData {
  range: Range;
  rangeLabel: string;
  periodLabel: string;
  updatedAt: string;
  kpis: Kpi[];
  timeseries: SeriesPoint[];
  funnel: FunnelStage[];
  sources: SourceSlice[];
  topProducts: TopProduct[];
  activity: Activity[];
  system: SystemStatus[];
}

// ── RNG determinístico (mulberry32) ─────────────────────────────────────────
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Série com tendência de alta suave + ruído, sempre positiva. */
function trendSeries(
  n: number,
  base: number,
  growth: number,
  noise: number,
  seed: number
): number[] {
  const r = rng(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const trend = base * (1 + (growth * i) / n);
    const wobble = 1 + (r() - 0.5) * noise;
    out.push(Math.max(0, Math.round(trend * wobble)));
  }
  return out;
}

function pctChange(series: number[]): number {
  if (series.length < 2) return 0;
  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half).reduce((a, b) => a + b, 0) / half || 1;
  const curr = series.slice(half).reduce((a, b) => a + b, 0) / (series.length - half) || 1;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

interface RangeConfig {
  points: number;
  label: (i: number, n: number) => string;
  periodLabel: string;
  scale: number;
  seed: number;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const RANGE_CONFIG: Record<Range, RangeConfig> = {
  '7d': {
    points: 7,
    periodLabel: 'últimos 7 dias',
    scale: 1,
    seed: 7,
    label: (i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return WEEKDAYS[d.getDay()] ?? '';
    },
  },
  '30d': {
    points: 30,
    periodLabel: 'últimos 30 dias',
    scale: 4.1,
    seed: 30,
    label: (i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return `${d.getDate()}/${d.getMonth() + 1}`;
    },
  },
  '90d': {
    points: 13,
    periodLabel: 'últimos 90 dias',
    scale: 12.5,
    seed: 90,
    label: (i, n) => `S${i + 1}/${n}`,
  },
  '12m': {
    points: 12,
    periodLabel: 'últimos 12 meses',
    scale: 30,
    seed: 12,
    label: (i) => {
      const m = (new Date().getMonth() - (11 - i) + 12) % 12;
      return MONTHS[m] ?? '';
    },
  },
};

export function getDashboardData(range: Range): DashboardData {
  const cfg = RANGE_CONFIG[range] ?? RANGE_CONFIG['30d'];
  const { points, scale, seed } = cfg;

  // Séries principais (receita diária/semanal/mensal e leads)
  const receitaDaily = trendSeries(points, 950 * scale, 0.34, 0.28, seed * 13);
  const leadsDaily = trendSeries(points, 4.2 * scale, 0.22, 0.55, seed * 29);

  const timeseries: SeriesPoint[] = receitaDaily.map((receita, i) => ({
    t: cfg.label(i, points),
    receita,
    leads: leadsDaily[i] ?? 0,
  }));

  const totalLeads = leadsDaily.reduce((a, b) => a + b, 0);
  const closed = Math.round(totalLeads * 0.063);
  const mrr = 48200 + Math.round((scale - 1) * 400);

  const mrrSeries = trendSeries(16, mrr * 0.7, 0.42, 0.14, seed * 3);
  const leadsSeries = trendSeries(16, 5 * scale, 0.3, 0.5, seed * 5);
  const convSeries = trendSeries(16, 58, 0.12, 0.22, seed * 7).map((v) => v / 10);
  const ticketsSeries = trendSeries(16, 22, -0.18, 0.4, seed * 11);

  const kpis: Kpi[] = [
    {
      id: 'mrr',
      label: 'MRR',
      value: mrr,
      format: 'currency',
      deltaPct: pctChange(mrrSeries),
      series: mrrSeries,
      hint: 'receita recorrente mensal',
    },
    {
      id: 'leads',
      label: 'Leads capturados',
      value: totalLeads,
      format: 'number',
      deltaPct: pctChange(leadsSeries),
      series: leadsSeries,
      hint: cfg.periodLabel,
    },
    {
      id: 'conv',
      label: 'Taxa de conversão',
      value: Math.round((closed / Math.max(1, totalLeads)) * 1000) / 10,
      format: 'percent',
      deltaPct: pctChange(convSeries),
      series: convSeries,
      hint: `${closed} negócios fechados`,
    },
    {
      id: 'tickets',
      label: 'Tickets abertos',
      value: 18,
      format: 'number',
      deltaPct: pctChange(ticketsSeries),
      series: ticketsSeries,
      hint: '3 fora do SLA',
      tone: 'warn',
    },
  ];

  const funnel: FunnelStage[] = [
    { label: 'Capturados', value: totalLeads },
    { label: 'Qualificados', value: Math.round(totalLeads * 0.57) },
    { label: 'Propostas', value: Math.round(totalLeads * 0.24) },
    { label: 'Fechados', value: closed },
  ];

  const sources: SourceSlice[] = [
    { label: 'Site / Vitrine', value: 41, color: '#7f3fe5' },
    { label: 'Instagram', value: 26, color: '#e71f84' },
    { label: 'Indicação', value: 19, color: '#66df7a' },
    { label: 'Google Ads', value: 9, color: '#f5a623' },
    { label: 'Outros', value: 5, color: '#6f6e78' },
  ];

  const topProducts: TopProduct[] = [
    { name: 'Crianex Flow', views: 3820, trendPct: 14.2 },
    { name: 'Crianex Vision', views: 2960, trendPct: 8.7 },
    { name: 'Crianex Pay', views: 2140, trendPct: -3.1 },
    { name: 'Crianex Desk', views: 1580, trendPct: 21.5 },
    { name: 'Crianex Insights', views: 1120, trendPct: 5.4 },
  ];

  const now = Date.now();
  const min = 60_000;
  const activity: Activity[] = [
    {
      id: 'a1',
      actor: 'Sistema',
      action: 'capturou novo lead',
      target: 'Mariana Costa',
      at: new Date(now - 8 * min).toISOString(),
      kind: 'lead',
    },
    {
      id: 'a2',
      actor: 'Otávio Maya',
      action: 'publicou o produto',
      target: 'Crianex Desk',
      at: new Date(now - 42 * min).toISOString(),
      kind: 'product',
    },
    {
      id: 'a3',
      actor: 'Hugo Freitas',
      action: 'respondeu ao ticket',
      target: '#4821',
      at: new Date(now - 95 * min).toISOString(),
      kind: 'ticket',
    },
    {
      id: 'a4',
      actor: 'Camile',
      action: 'editou a FAQ',
      target: 'Como contratar?',
      at: new Date(now - 3 * 60 * min).toISOString(),
      kind: 'faq',
    },
    {
      id: 'a5',
      actor: 'Sistema',
      action: 'moveu lead para',
      target: 'Proposta enviada',
      at: new Date(now - 5 * 60 * min).toISOString(),
      kind: 'lead',
    },
    {
      id: 'a6',
      actor: 'Leonardo',
      action: 'adicionou o membro',
      target: 'Ana Paula',
      at: new Date(now - 9 * 60 * min).toISOString(),
      kind: 'member',
    },
  ];

  const system: SystemStatus[] = [
    { label: 'API Backend', status: 'ok', detail: '142 ms · saudável' },
    { label: 'Supabase / Postgres', status: 'ok', detail: 'conectado · 38 ms' },
    { label: 'Fila de e-mails', status: 'warn', detail: '2 pendentes' },
    { label: 'Uptime (30d)', status: 'ok', detail: '99,94%' },
  ];

  return {
    range,
    rangeLabel: RANGES.find((r) => r.id === range)?.label ?? '30 dias',
    periodLabel: cfg.periodLabel,
    updatedAt: new Date().toISOString(),
    kpis,
    timeseries,
    funnel,
    sources,
    topProducts,
    activity,
    system,
  };
}
