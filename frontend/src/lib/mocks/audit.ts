// ─────────────────────────────────────────────────────────────────────────────
// Mock do módulo "Auditoria" — trilha de ações privilegiadas do painel (auth,
// segurança, permissões, membros, config). Foco em segurança/compliance:
// cada evento registra ator, recurso, resultado, IP e detalhes.
// ─────────────────────────────────────────────────────────────────────────────

export type AuditCategory =
  | 'auth'
  | 'seguranca'
  | 'membros'
  | 'produtos'
  | 'faq'
  | 'crm'
  | 'config';

export type AuditResult = 'sucesso' | 'negado' | 'alerta';

export interface AuditDetail {
  label: string;
  value: string;
}

export interface AuditEvent {
  id: string;
  at: string; // ISO
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  category: AuditCategory;
  result: AuditResult;
  ip: string;
  details: AuditDetail[];
}

export interface AuditData {
  summary: { total: number; negados: number; logins: number; permissao: number };
  events: AuditEvent[];
}

export const CATEGORY_META: Record<AuditCategory, { label: string; color: string }> = {
  auth: { label: 'Autenticação', color: '#3b9ae1' },
  seguranca: { label: 'Segurança', color: '#e71f84' },
  membros: { label: 'Membros', color: '#66df7a' },
  produtos: { label: 'Produtos', color: '#7f3fe5' },
  faq: { label: 'FAQ', color: '#f5a623' },
  crm: { label: 'CRM', color: '#2dd4bf' },
  config: { label: 'Configuração', color: '#6f6e78' },
};

export const RESULT_META: Record<AuditResult, { label: string; color: string }> = {
  sucesso: { label: 'Sucesso', color: '#66df7a' },
  negado: { label: 'Negado', color: '#e71f84' },
  alerta: { label: 'Alerta', color: '#f5a623' },
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const at = (agoMs: number) => new Date(Date.now() - agoMs).toISOString();

const RAW: Omit<AuditEvent, 'id'>[] = [
  {
    at: at(12 * MIN),
    actor: 'Otávio Maya',
    actorRole: 'owner',
    action: 'Alterou permissões',
    resource: 'Membro: Hugo Freitas',
    category: 'seguranca',
    result: 'sucesso',
    ip: '189.6.44.21',
    details: [
      { label: 'Módulo', value: 'crm' },
      { label: 'Permissão', value: 'v, e (adicionada: e)' },
    ],
  },
  {
    at: at(48 * MIN),
    actor: 'desconhecido',
    actorRole: '—',
    action: 'Tentativa de login falha',
    resource: 'owner@crianex.com',
    category: 'auth',
    result: 'negado',
    ip: '45.231.108.7',
    details: [
      { label: 'Motivo', value: 'Senha incorreta (3ª tentativa)' },
      { label: 'Bloqueio', value: 'Rate limit aplicado' },
    ],
  },
  {
    at: at(1 * HOUR),
    actor: 'Hugo Freitas',
    actorRole: 'member',
    action: 'Login',
    resource: 'Sessão administrativa',
    category: 'auth',
    result: 'sucesso',
    ip: '177.92.15.203',
    details: [{ label: 'MFA', value: 'Verificado (TOTP)' }],
  },
  {
    at: at(90 * MIN),
    actor: 'Camile',
    actorRole: 'member',
    action: 'Acesso negado a módulo',
    resource: '/admin/financeiro',
    category: 'seguranca',
    result: 'negado',
    ip: '201.17.88.9',
    details: [{ label: 'Motivo', value: 'Sem permissão de visualização (finance)' }],
  },
  {
    at: at(3 * HOUR),
    actor: 'Otávio Maya',
    actorRole: 'owner',
    action: 'Criou membro',
    resource: 'Membro: Ana Paula',
    category: 'membros',
    result: 'sucesso',
    ip: '189.6.44.21',
    details: [
      { label: 'Papel', value: 'member' },
      { label: 'Convite', value: 'Enviado por e-mail' },
    ],
  },
  {
    at: at(5 * HOUR),
    actor: 'Leonardo',
    actorRole: 'member',
    action: 'Publicou produto',
    resource: 'Crianex Desk',
    category: 'produtos',
    result: 'sucesso',
    ip: '187.45.201.33',
    details: [{ label: 'Status', value: 'Rascunho → Publicado' }],
  },
  {
    at: at(7 * HOUR),
    actor: 'Hugo Freitas',
    actorRole: 'member',
    action: 'Redefiniu MFA',
    resource: 'Própria conta',
    category: 'seguranca',
    result: 'alerta',
    ip: '177.92.15.203',
    details: [{ label: 'Ação', value: 'Novo segredo TOTP gerado' }],
  },
  {
    at: at(1 * DAY - 2 * HOUR),
    actor: 'Camile',
    actorRole: 'member',
    action: 'Editou FAQ',
    resource: 'Como contratar?',
    category: 'faq',
    result: 'sucesso',
    ip: '201.17.88.9',
    details: [{ label: 'Idioma', value: 'PT + EN' }],
  },
  {
    at: at(1 * DAY),
    actor: 'Leonardo',
    actorRole: 'member',
    action: 'Exportou leads',
    resource: 'CRM · 127 registros',
    category: 'crm',
    result: 'alerta',
    ip: '187.45.201.33',
    details: [
      { label: 'Formato', value: 'CSV' },
      { label: 'Contém PII', value: 'Sim (nome, e-mail, telefone)' },
    ],
  },
  {
    at: at(1 * DAY + 4 * HOUR),
    actor: 'Otávio Maya',
    actorRole: 'owner',
    action: 'Alterou configuração',
    resource: 'Rate limit de leads',
    category: 'config',
    result: 'sucesso',
    ip: '189.6.44.21',
    details: [{ label: 'Valor', value: '5 → 8 req / 10 min' }],
  },
  {
    at: at(2 * DAY),
    actor: 'desconhecido',
    actorRole: '—',
    action: 'Tentativa de acesso à API',
    resource: '/api/admin/members',
    category: 'seguranca',
    result: 'negado',
    ip: '103.211.9.144',
    details: [
      { label: 'Motivo', value: 'JWT ausente/inválido' },
      { label: 'Origem', value: 'Fora do CORS permitido' },
    ],
  },
  {
    at: at(2 * DAY + 6 * HOUR),
    actor: 'Heitor',
    actorRole: 'member',
    action: 'Removeu membro',
    resource: 'Membro: usuário de teste',
    category: 'membros',
    result: 'sucesso',
    ip: '191.32.7.56',
    details: [{ label: 'Confirmação', value: 'Nome digitado' }],
  },
  {
    at: at(3 * DAY),
    actor: 'Otávio Maya',
    actorRole: 'owner',
    action: 'Login',
    resource: 'Sessão administrativa',
    category: 'auth',
    result: 'sucesso',
    ip: '189.6.44.21',
    details: [{ label: 'MFA', value: 'Verificado (TOTP)' }],
  },
];

export function getAuditData(): AuditData {
  const events: AuditEvent[] = RAW.map((e, i) => ({ ...e, id: `audit_${9000 + i}` }));

  const negados = events.filter((e) => e.result === 'negado').length;
  const logins = events.filter((e) => e.category === 'auth' && e.action === 'Login').length;
  const permissao = events.filter((e) => e.action.toLowerCase().includes('permiss')).length;

  return {
    summary: { total: events.length, negados, logins, permissao },
    events,
  };
}
