// ─────────────────────────────────────────────────────────────────────────────
// Mock de dados do módulo de Tickets (suporte). `getTicketsData()` devolve a fila
// completa + KPIs derivados. Pronto para trocar por backend/Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import type { Kpi } from './dashboard';

export type TicketStatus = 'aberto' | 'andamento' | 'resolvido';
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TicketChannel = 'email' | 'chat' | 'telefone' | 'formulario';

export interface TicketMessage {
  id: string;
  author: string;
  role: 'cliente' | 'agente';
  body: string;
  at: string; // ISO
}

export interface Ticket {
  id: string;
  subject: string;
  cliente: string;
  produto: string;
  channel: TicketChannel;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string; // prazo de SLA
  firstResponseMin: number | null;
  tags: string[];
  messages: TicketMessage[];
}

export interface TicketsData {
  kpis: Kpi[];
  tickets: Ticket[];
  counts: Record<TicketStatus, number>;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = () => Date.now();

function iso(offsetMs: number): string {
  return new Date(now() + offsetMs).toISOString();
}

function msg(id: string, author: string, role: 'cliente' | 'agente', body: string, agoMs: number): TicketMessage {
  return { id, author, role, body, at: iso(-agoMs) };
}

function buildTickets(): Ticket[] {
  return [
    {
      id: 'TKT-1042',
      subject: 'Erro ao gerar relatório mensal no Crianex Flow',
      cliente: 'Vitalis Saúde',
      produto: 'Crianex Flow',
      channel: 'email',
      priority: 'alta',
      status: 'aberto',
      assignee: null,
      createdAt: iso(-3 * HOUR),
      updatedAt: iso(-40 * MIN),
      slaDueAt: iso(1 * HOUR),
      firstResponseMin: null,
      tags: ['relatórios', 'bug'],
      messages: [
        msg('m1', 'Renata (Vitalis)', 'cliente', 'Ao exportar o relatório mensal recebo um erro 500. Podem verificar? É urgente para o fechamento.', 3 * HOUR),
      ],
    },
    {
      id: 'TKT-1041',
      subject: 'Dúvida sobre limites do plano Business',
      cliente: 'NovaEdu',
      produto: 'Crianex Vision',
      channel: 'chat',
      priority: 'baixa',
      status: 'andamento',
      assignee: 'Hugo Freitas',
      createdAt: iso(-6 * HOUR),
      updatedAt: iso(-25 * MIN),
      slaDueAt: iso(5 * HOUR),
      firstResponseMin: 18,
      tags: ['billing', 'planos'],
      messages: [
        msg('m1', 'Carlos (NovaEdu)', 'cliente', 'Quantos usuários o plano Business suporta? Estamos perto do limite.', 6 * HOUR),
        msg('m2', 'Hugo Freitas', 'agente', 'Olá Carlos! O Business cobre até 50 assentos. Quer que eu prepare um upgrade?', 5.7 * HOUR),
        msg('m3', 'Carlos (NovaEdu)', 'cliente', 'Perfeito, vou avaliar com o time e retorno.', 25 * MIN),
      ],
    },
    {
      id: 'TKT-1040',
      subject: 'Integração via API retornando 401 intermitente',
      cliente: 'Grupo Aurora',
      produto: 'Crianex Pay',
      channel: 'email',
      priority: 'urgente',
      status: 'aberto',
      assignee: 'Leonardo',
      createdAt: iso(-90 * MIN),
      updatedAt: iso(-12 * MIN),
      slaDueAt: iso(-20 * MIN), // fora do SLA
      firstResponseMin: 22,
      tags: ['api', 'auth', 'produção'],
      messages: [
        msg('m1', 'Diego (Aurora)', 'cliente', 'Nossa integração está recebendo 401 de forma intermitente desde hoje de manhã. Está afetando pagamentos.', 90 * MIN),
        msg('m2', 'Leonardo', 'agente', 'Estamos investigando com prioridade máxima. Você notou correlação com algum horário?', 68 * MIN),
      ],
    },
    {
      id: 'TKT-1039',
      subject: 'Solicitação de nova funcionalidade: exportar CSV',
      cliente: 'Loja Bem-Estar',
      produto: 'Crianex Desk',
      channel: 'formulario',
      priority: 'baixa',
      status: 'andamento',
      assignee: 'Camile',
      createdAt: iso(-2 * 24 * HOUR),
      updatedAt: iso(-4 * HOUR),
      slaDueAt: iso(2 * 24 * HOUR),
      firstResponseMin: 45,
      tags: ['feature-request'],
      messages: [
        msg('m1', 'Paula (Bem-Estar)', 'cliente', 'Seria possível exportar a lista de atendimentos em CSV?', 2 * 24 * HOUR),
        msg('m2', 'Camile', 'agente', 'Boa ideia! Encaminhei para o time de produto avaliar no roadmap.', 47 * HOUR),
      ],
    },
    {
      id: 'TKT-1038',
      subject: 'Fatura duplicada no cartão',
      cliente: 'Técnico BR',
      produto: 'Crianex Pay',
      channel: 'telefone',
      priority: 'media',
      status: 'aberto',
      assignee: null,
      createdAt: iso(-5 * HOUR),
      updatedAt: iso(-5 * HOUR),
      slaDueAt: iso(3 * HOUR),
      firstResponseMin: null,
      tags: ['billing', 'reembolso'],
      messages: [
        msg('m1', 'Marcos (Técnico BR)', 'cliente', 'Fui cobrado duas vezes na fatura deste mês. Preciso de estorno.', 5 * HOUR),
      ],
    },
    {
      id: 'TKT-1037',
      subject: 'Como configurar SSO com Google Workspace',
      cliente: 'Agência Norte',
      produto: 'Crianex Flow',
      channel: 'chat',
      priority: 'media',
      status: 'resolvido',
      assignee: 'Hugo Freitas',
      createdAt: iso(-3 * 24 * HOUR),
      updatedAt: iso(-2 * 24 * HOUR),
      slaDueAt: iso(-2 * 24 * HOUR),
      firstResponseMin: 12,
      tags: ['sso', 'setup'],
      messages: [
        msg('m1', 'Bruna (Norte)', 'cliente', 'Preciso ativar login com Google para o time. Como faço?', 3 * 24 * HOUR),
        msg('m2', 'Hugo Freitas', 'agente', 'Enviei o passo a passo: Configurações → Segurança → SSO. Qualquer dúvida me chama!', 3 * 24 * HOUR - 12 * MIN),
        msg('m3', 'Bruna (Norte)', 'cliente', 'Funcionou perfeitamente, obrigada!', 2 * 24 * HOUR),
      ],
    },
    {
      id: 'TKT-1036',
      subject: 'Painel lento ao carregar muitos registros',
      cliente: 'FinanPlus',
      produto: 'Crianex Insights',
      channel: 'email',
      priority: 'alta',
      status: 'andamento',
      assignee: 'Leonardo',
      createdAt: iso(-8 * HOUR),
      updatedAt: iso(-90 * MIN),
      slaDueAt: iso(30 * MIN), // SLA em risco
      firstResponseMin: 34,
      tags: ['performance'],
      messages: [
        msg('m1', 'Sérgio (FinanPlus)', 'cliente', 'O dashboard demora ~15s para abrir com nossos dados. Dá para otimizar?', 8 * HOUR),
        msg('m2', 'Leonardo', 'agente', 'Identificamos consultas sem índice; já estamos aplicando uma correção. Retorno ainda hoje.', 7.4 * HOUR),
      ],
    },
    {
      id: 'TKT-1035',
      subject: 'Alteração de e-mail do administrador',
      cliente: 'Clínica Viver',
      produto: 'Crianex Desk',
      channel: 'formulario',
      priority: 'baixa',
      status: 'resolvido',
      assignee: 'Camile',
      createdAt: iso(-4 * 24 * HOUR),
      updatedAt: iso(-3 * 24 * HOUR),
      slaDueAt: iso(-3 * 24 * HOUR),
      firstResponseMin: 52,
      tags: ['conta'],
      messages: [
        msg('m1', 'Ana (Viver)', 'cliente', 'Preciso trocar o e-mail do admin da conta.', 4 * 24 * HOUR),
        msg('m2', 'Camile', 'agente', 'Alteração feita e confirmada por e-mail. 🙂', 4 * 24 * HOUR - 52 * MIN),
      ],
    },
    {
      id: 'TKT-1034',
      subject: 'Webhook não dispara em novos pedidos',
      cliente: 'Móveis Duarte',
      produto: 'Crianex Pay',
      channel: 'email',
      priority: 'alta',
      status: 'aberto',
      assignee: null,
      createdAt: iso(-70 * MIN),
      updatedAt: iso(-70 * MIN),
      slaDueAt: iso(2 * HOUR),
      firstResponseMin: null,
      tags: ['webhook', 'api'],
      messages: [
        msg('m1', 'Rafael (Duarte)', 'cliente', 'Os webhooks pararam de disparar em novos pedidos desde ontem à noite.', 70 * MIN),
      ],
    },
    {
      id: 'TKT-1033',
      subject: 'Elogio ao atendimento',
      cliente: 'NovaEdu',
      produto: 'Crianex Vision',
      channel: 'chat',
      priority: 'baixa',
      status: 'resolvido',
      assignee: 'Hugo Freitas',
      createdAt: iso(-5 * 24 * HOUR),
      updatedAt: iso(-5 * 24 * HOUR),
      slaDueAt: iso(-5 * 24 * HOUR),
      firstResponseMin: 8,
      tags: ['feedback'],
      messages: [
        msg('m1', 'Carlos (NovaEdu)', 'cliente', 'Só queria agradecer pelo suporte rápido de sempre!', 5 * 24 * HOUR),
        msg('m2', 'Hugo Freitas', 'agente', 'Muito obrigado, Carlos! Ficamos felizes. 💜', 5 * 24 * HOUR - 8 * MIN),
      ],
    },
  ];
}

export function getTicketsData(): TicketsData {
  const tickets = buildTickets();

  const counts: Record<TicketStatus, number> = { aberto: 0, andamento: 0, resolvido: 0 };
  for (const t of tickets) counts[t.status]++;

  const nowMs = now();
  const slaRisco = tickets.filter(
    (t) => t.status !== 'resolvido' && new Date(t.slaDueAt).getTime() - nowMs < 60 * MIN,
  ).length;

  const responded = tickets.filter((t) => t.firstResponseMin != null);
  const avgFirst = responded.length
    ? Math.round(responded.reduce((a, t) => a + (t.firstResponseMin ?? 0), 0) / responded.length)
    : 0;

  const kpis: Kpi[] = [
    {
      id: 'aberto',
      label: 'Abertos',
      value: counts.aberto,
      format: 'number',
      deltaPct: 8.3,
      series: [3, 4, 4, 5, 4, 6, 5, counts.aberto],
      hint: 'aguardando primeira resposta',
    },
    {
      id: 'andamento',
      label: 'Em andamento',
      value: counts.andamento,
      format: 'number',
      deltaPct: -4.1,
      series: [5, 6, 4, 5, 3, 4, 3, counts.andamento],
      hint: 'sendo tratados agora',
    },
    {
      id: 'resolvido',
      label: 'Resolvidos (7d)',
      value: 42,
      format: 'number',
      deltaPct: 12.6,
      series: [4, 5, 6, 5, 7, 6, 8, 7],
      hint: 'nos últimos 7 dias',
    },
    {
      id: 'sla',
      label: 'SLA em risco',
      value: slaRisco,
      format: 'number',
      deltaPct: 5.0,
      series: [1, 0, 2, 1, 2, 1, 3, slaRisco],
      hint: `tempo médio 1ª resposta: ${avgFirst} min`,
      tone: 'warn',
    },
  ];

  return { kpis, tickets, counts };
}
