// Paleta de cores selecionáveis ao personalizar um template de notificação — mesma
// paleta usada no editor de colunas do CRM (admin/crm/+page.svelte), para
// consistência visual entre os dois pontos de customização de cor do admin.
export const TEMPLATE_COLOR_PALETTE = [
  '#7f3fe5',
  '#e71f84',
  '#66df7a',
  '#3b82f6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#eab308',
] as const;

// Catálogo fixo de tipos de evento. Espelho de
// backend/src/notification-templates/notification-event-types.ts — mantenha os
// dois em sincronia ao adicionar/alterar um tipo (não há pacote compartilhado).
export type NotificationEventType = {
  value: string;
  label: string;
  grupo: string;
  color: string;
  implemented: boolean;
  descricao: string;
};

export const NOTIFICATION_EVENT_TYPES: readonly NotificationEventType[] = [
  {
    value: 'novo_lead',
    label: 'Novo lead',
    grupo: 'Leads',
    color: '#7f3fe5',
    implemented: true,
    descricao: 'Disparado quando um novo lead é capturado pelo formulário público.',
  },
  {
    value: 'responsavel_atribuido',
    label: 'Responsável atribuído',
    grupo: 'Leads',
    color: '#66df7a',
    implemented: true,
    descricao:
      'Disparado para o membro escolhido quando ele é definido como responsável por um card do CRM.',
  },
  {
    value: 'seguranca_controle',
    label: 'Segurança e controle',
    grupo: 'Segurança e controle',
    color: '#eab308',
    implemented: true,
    descricao:
      'Cobre login no site, spam no formulário de captação, login não autorizado e problemas de RLS.',
  },
  {
    value: 'logs_monitoramento',
    label: 'Logs e monitoramento',
    grupo: 'Operacional',
    color: '#06b6d4',
    implemented: true,
    descricao:
      'Alterações no catálogo de produtos (criação, publicação, despublicação e exclusão) via crianex-notify.',
  },
  {
    value: 'financeiro',
    label: 'Financeiro',
    grupo: 'Financeiro',
    color: '#66df7a',
    implemented: false,
    descricao: 'Reservado para eventos financeiros (CP7 — aguardando backend próprio).',
  },
  {
    value: 'dashboard',
    label: 'Dashboard executivo',
    grupo: 'Dashboard',
    color: '#3b82f6',
    implemented: false,
    descricao: 'Reservado para alertas do dashboard executivo (CP3 — aguardando backend próprio).',
  },
  {
    value: 'suporte',
    label: 'Tickets de suporte',
    grupo: 'Suporte',
    color: '#ec4899',
    implemented: false,
    descricao: 'Reservado para tickets de suporte (CP8 — aguardando backend próprio).',
  },
];
