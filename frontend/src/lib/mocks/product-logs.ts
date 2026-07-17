// ─────────────────────────────────────────────────────────────────────────────
// Mock do módulo "Logs de Produtos" — trilha de alterações da vitrine de produtos
// (criação, edição, publicação, preço, reordenação, exclusão) com diff campo-a-campo.
// ─────────────────────────────────────────────────────────────────────────────

export type LogAction =
  | 'criacao'
  | 'edicao'
  | 'publicacao'
  | 'despublicacao'
  | 'preco'
  | 'reordenacao'
  | 'exclusao';

export interface FieldChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface ProductLog {
  id: string;
  action: LogAction;
  productName: string;
  productId: string;
  actor: string;
  at: string; // ISO
  summary: string;
  changes: FieldChange[];
}

export interface ProductLogsData {
  summary: { total: number; produtosAfetados: number; publicacoes: number };
  logs: ProductLog[];
}

export const ACTION_META: Record<LogAction, { label: string; color: string }> = {
  criacao: { label: 'Criação', color: '#66df7a' },
  edicao: { label: 'Edição', color: '#7f3fe5' },
  publicacao: { label: 'Publicação', color: '#66df7a' },
  despublicacao: { label: 'Despublicação', color: '#f5a623' },
  preco: { label: 'Preço', color: '#3b9ae1' },
  reordenacao: { label: 'Reordenação', color: '#6f6e78' },
  exclusao: { label: 'Exclusão', color: '#e71f84' },
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const at = (agoMs: number) => new Date(Date.now() - agoMs).toISOString();

const RAW: Omit<ProductLog, 'id'>[] = [
  {
    action: 'preco',
    productName: 'Crianex Pay',
    productId: 'prod_pay',
    actor: 'Otávio Maya',
    at: at(35 * MIN),
    summary: 'Preço mensal ajustado',
    changes: [{ field: 'Preço mensal', before: 'R$ 199', after: 'R$ 179' }],
  },
  {
    action: 'edicao',
    productName: 'Crianex Flow',
    productId: 'prod_flow',
    actor: 'Camile',
    at: at(2 * HOUR),
    summary: 'Descrição e tagline atualizadas',
    changes: [
      { field: 'Tagline (PT)', before: 'Gestão de fluxos', after: 'Automação de fluxos de trabalho' },
      {
        field: 'Descrição (PT)',
        before: 'Organize processos internos com facilidade.',
        after: 'Automatize e monitore processos internos ponta a ponta.',
      },
    ],
  },
  {
    action: 'publicacao',
    productName: 'Crianex Desk',
    productId: 'prod_desk',
    actor: 'Otávio Maya',
    at: at(4 * HOUR),
    summary: 'Publicado na vitrine',
    changes: [{ field: 'Status', before: 'Rascunho', after: 'Publicado' }],
  },
  {
    action: 'reordenacao',
    productName: 'Crianex Vision',
    productId: 'prod_vision',
    actor: 'Heitor',
    at: at(6 * HOUR),
    summary: 'Reordenado na listagem',
    changes: [{ field: 'Posição', before: '4º', after: '2º' }],
  },
  {
    action: 'edicao',
    productName: 'Crianex Insights',
    productId: 'prod_insights',
    actor: 'Hugo Freitas',
    at: at(9 * HOUR),
    summary: 'Imagem de capa e categoria alteradas',
    changes: [
      { field: 'Categoria', before: 'Analytics', after: 'Business Intelligence' },
      { field: 'Imagem', before: 'insights-v1.png', after: 'insights-v2.png' },
    ],
  },
  {
    action: 'criacao',
    productName: 'Crianex Desk',
    productId: 'prod_desk',
    actor: 'Otávio Maya',
    at: at(1 * DAY - 2 * HOUR),
    summary: 'Produto criado como rascunho',
    changes: [],
  },
  {
    action: 'despublicacao',
    productName: 'Crianex Legacy',
    productId: 'prod_legacy',
    actor: 'Leonardo',
    at: at(1 * DAY - 30 * MIN),
    summary: 'Removido da vitrine (descontinuado)',
    changes: [{ field: 'Status', before: 'Publicado', after: 'Despublicado' }],
  },
  {
    action: 'preco',
    productName: 'Crianex Vision',
    productId: 'prod_vision',
    actor: 'Otávio Maya',
    at: at(1 * DAY),
    summary: 'Preço anual promocional',
    changes: [
      { field: 'Preço anual', before: 'R$ 2.390', after: 'R$ 1.990' },
      { field: 'Selo', before: null, after: 'Promoção' },
    ],
  },
  {
    action: 'edicao',
    productName: 'Crianex Flow',
    productId: 'prod_flow',
    actor: 'Camile',
    at: at(1 * DAY + 3 * HOUR),
    summary: 'URL do produto corrigida',
    changes: [
      { field: 'URL', before: 'crianex.com/flow-beta', after: 'crianex.com/flow' },
    ],
  },
  {
    action: 'exclusao',
    productName: 'Crianex Trial',
    productId: 'prod_trial',
    actor: 'Leonardo',
    at: at(2 * DAY),
    summary: 'Produto de teste removido',
    changes: [],
  },
  {
    action: 'publicacao',
    productName: 'Crianex Vision',
    productId: 'prod_vision',
    actor: 'Otávio Maya',
    at: at(2 * DAY + 5 * HOUR),
    summary: 'Publicado na vitrine',
    changes: [{ field: 'Status', before: 'Rascunho', after: 'Publicado' }],
  },
  {
    action: 'criacao',
    productName: 'Crianex Insights',
    productId: 'prod_insights',
    actor: 'Hugo Freitas',
    at: at(3 * DAY),
    summary: 'Produto criado',
    changes: [],
  },
];

export function getProductLogsData(): ProductLogsData {
  const logs: ProductLog[] = RAW.map((l, i) => ({ ...l, id: `plog_${1200 + i}` }));

  const produtosAfetados = new Set(logs.map((l) => l.productId)).size;
  const publicacoes = logs.filter((l) => l.action === 'publicacao').length;

  return {
    summary: { total: logs.length, produtosAfetados, publicacoes },
    logs,
  };
}
