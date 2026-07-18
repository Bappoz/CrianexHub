import { createHash } from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { supabase } from '../lib/supabase.js';
import type { LeadAssessment, LeadQualification } from './lead-scoring.js';

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  company?: string | undefined;
  role?: string | undefined; // cargo
  phone?: string | undefined;
  product_interest?: string | undefined; // slug do produto
  origem?: string | undefined;
  qualification?: LeadQualification | undefined;
};

export type ValidationError = { field: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_MESSAGE = 2000;
const MAX_COMPANY = 150;
const MAX_ROLE = 100;
const MAX_PHONE = 30;
const MAX_USECASE = 500;

// Valores aceitos para cada resposta do wizard — qualquer coisa fora disso é
// descartada (o jsonb no banco só guarda enums conhecidos, nada de lixo do cliente).
const TEAM_SIZES = new Set(['solo', 'small', 'medium', 'large']);
const TIMELINES = new Set(['now', 'month', 'quarter', 'exploring']);
const CHANNELS = new Set(['email', 'whatsapp', 'phone']);

export function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip || 'unknown')
    .digest('hex');
}

function sanitize(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeOptional(value: unknown, max?: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = sanitize(value);
  if (!clean) return undefined;
  return max ? clean.slice(0, max) : clean;
}

export function validate(input: ContactInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.name) {
    errors.push({ field: 'name', message: 'Nome é obrigatório.' });
  } else if (input.name.length > MAX_NAME) {
    errors.push({ field: 'name', message: `Nome deve ter no máximo ${MAX_NAME} caracteres.` });
  }

  if (!EMAIL_RE.test(input.email)) {
    errors.push({ field: 'email', message: 'E-mail inválido.' });
  }

  if (!input.message) {
    errors.push({ field: 'message', message: 'Mensagem é obrigatória.' });
  } else if (input.message.length > MAX_MESSAGE) {
    errors.push({
      field: 'message',
      message: `Mensagem deve ter no máximo ${MAX_MESSAGE} caracteres.`,
    });
  }

  if (input.company && input.company.length > MAX_COMPANY) {
    errors.push({
      field: 'company',
      message: `Empresa deve ter no máximo ${MAX_COMPANY} caracteres.`,
    });
  }

  return errors;
}

function sanitizeQualification(value: unknown): LeadQualification | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const q = value as Record<string, unknown>;
  const out: LeadQualification = {};

  const teamSize = sanitizeOptional(q['teamSize'], 20);
  if (teamSize && TEAM_SIZES.has(teamSize)) out.teamSize = teamSize;

  const timeline = sanitizeOptional(q['timeline'], 20);
  if (timeline && TIMELINES.has(timeline)) out.timeline = timeline;

  const channel = sanitizeOptional(q['channel'], 20);
  if (channel && CHANNELS.has(channel)) out.channel = channel;

  const budget = sanitizeOptional(q['budget'], 60);
  if (budget) out.budget = budget;

  const useCase = sanitizeOptional(q['useCase'], MAX_USECASE);
  if (useCase) out.useCase = useCase;

  return Object.keys(out).length ? out : undefined;
}

export function sanitizeInput(body: Record<string, unknown>): ContactInput {
  const input: ContactInput = {
    name: sanitize(String(body['name'] ?? '')),
    email: sanitize(String(body['email'] ?? '')).toLowerCase(),
    message: sanitize(String(body['message'] ?? '')),
  };

  const company = sanitizeOptional(body['company'], MAX_COMPANY);
  if (company) input.company = company;

  const role = sanitizeOptional(body['role'], MAX_ROLE);
  if (role) input.role = role;

  const phone = sanitizeOptional(body['phone'], MAX_PHONE);
  if (phone) input.phone = phone;

  const product = sanitizeOptional(body['product_interest'], 100);
  if (product && product !== 'other') input.product_interest = product;

  const origem = sanitizeOptional(body['origem'], 60);
  input.origem = origem ?? 'formulario_publico';

  const qualification = sanitizeQualification(body['qualification']);
  if (qualification) input.qualification = qualification;

  return input;
}

const TIMELINE_LABELS: Record<string, string> = {
  now: 'começar agora',
  month: 'começar este mês',
  quarter: 'começar este trimestre',
  exploring: 'ainda explorando',
};
const TEAM_LABELS: Record<string, string> = {
  solo: 'só a pessoa',
  small: '2–10 pessoas',
  medium: '11–50 pessoas',
  large: '50+ pessoas',
};

// Conteúdo da notificação/quarentena. clients/client_cards não têm colunas para a
// mensagem crua, então ela + o resumo da qualificação ficam registrados aqui e no
// histórico da interação (RNF11 — minimização: nada além do necessário).
export function buildNotificationContent(
  input: ContactInput,
  assessment?: LeadAssessment
): string {
  const partes: string[] = [];
  if (assessment?.spam) {
    partes.push(`⚠️ Possível spam retido: ${input.name} <${input.email}>`);
    if (assessment.spamReasons.length) partes.push(`Motivos: ${assessment.spamReasons.join('; ')}`);
  } else {
    const temp = assessment ? ` [${assessment.temperature} · ${assessment.score}]` : '';
    partes.push(`Novo lead${temp}: ${input.name} <${input.email}>`);
  }
  if (input.company) partes.push(`Empresa: ${input.company}`);
  if (input.role) partes.push(`Cargo: ${input.role}`);
  if (input.phone) partes.push(`Telefone: ${input.phone}`);
  if (input.product_interest) partes.push(`Interesse: ${input.product_interest}`);
  const q = input.qualification;
  if (q?.timeline && TIMELINE_LABELS[q.timeline]) partes.push(`Prazo: ${TIMELINE_LABELS[q.timeline]}`);
  if (q?.teamSize && TEAM_LABELS[q.teamSize]) partes.push(`Equipe: ${TEAM_LABELS[q.teamSize]}`);
  partes.push(`Mensagem: ${input.message}`);
  return partes.join(' — ');
}

// Captação pública em transação ACID: client + client_card + notification +
// interaction criados de uma vez pela RPC capture_lead. O corpo PL/pgSQL roda em
// uma única transação — qualquer falha desfaz tudo (RF37). O assessment (score/
// temperatura/spam) é calculado no servidor e persistido junto.
export async function captureLead(input: ContactInput, assessment: LeadAssessment): Promise<void> {
  const { error } = await supabase.rpc('capture_lead', {
    p_nome: input.name,
    p_email: input.email,
    p_conteudo: buildNotificationContent(input, assessment),
    p_telefone: input.phone ?? null,
    p_mensagem: input.message,
    p_empresa: input.company ?? null,
    p_cargo: input.role ?? null,
    p_origem: input.origem ?? null,
    p_produto_slug: input.product_interest ?? null,
    p_qualificacao: input.qualification ?? {},
    p_score: assessment.score,
    p_temperatura: assessment.temperature,
    p_spam: assessment.spam,
    p_spam_motivos: assessment.spamReasons,
  } as never);

  if (error) {
    throw new Error(`capture_lead transaction failed: ${error.message}`);
  }
}
