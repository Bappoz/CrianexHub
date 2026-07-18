// Lead-scoring determinístico (sem ML/serviço externo): classifica cada captação
// em (a) score de qualidade 0–100 → temperatura, e (b) spam sim/não com motivos.
// Puro e testável: mesma entrada → mesma saída. É a única fonte de verdade do
// score (o frontend nunca é confiável). Usado pelo controller de /public/contact.

export type LeadQualification = {
  teamSize?: string | undefined; // 'solo' | 'small' | 'medium' | 'large'
  timeline?: string | undefined; // 'now' | 'month' | 'quarter' | 'exploring'
  budget?: string | undefined; // faixa livre
  useCase?: string | undefined; // texto curto do caso de uso
  channel?: string | undefined; // 'email' | 'whatsapp' | 'phone'
};

export type LeadSignals = {
  name: string;
  email: string;
  message: string;
  company?: string | undefined;
  role?: string | undefined; // cargo
  phone?: string | undefined;
  productSlug?: string | undefined;
  qualification?: LeadQualification | undefined;
  elapsedMs?: number | undefined; // tempo de preenchimento (a partir do iat do token)
};

export type Temperature = 'quente' | 'morno' | 'frio';

export type LeadAssessment = {
  score: number; // 0–100
  temperature: Temperature;
  spam: boolean;
  spamReasons: string[]; // rótulos pt-BR para auditoria/quarentena
};

// Menos que isso para preencher um wizard de 6 passos é, na prática, um bot.
export const MIN_HUMAN_FILL_MS = 2000;
const SPAM_THRESHOLD = 100;

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.com.br',
  'outlook.com',
  'outlook.com.br',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.com.br',
  'ymail.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'aol.com',
  'bol.com.br',
  'uol.com.br',
  'terra.com.br',
  'ig.com.br',
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'getnada.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
  'mvrht.com',
  'moakt.com',
  'mailnesia.com',
]);

// Termos promocionais/golpe típicos de spam de formulário (pt + en).
const SPAM_KEYWORDS = [
  'seo',
  'backlink',
  'ranking',
  'rank your',
  'crypto',
  'bitcoin',
  'forex',
  'casino',
  'viagra',
  'cialis',
  'payday',
  'escort',
  'porn',
  'replica',
  'free money',
  'make money',
  'investment opportunity',
  'click here',
  'buy now',
  'weight loss',
  'betting',
  'aposta', // cobre "apostas"/"apostar" via includes; não duplicar formas flexionadas
  'empréstimo',
  'emprestimo',
  'ganhe dinheiro',
  'renda extra',
  'marketing digital',
  'aumente suas vendas',
];

const SENIOR_ROLE_TERMS = [
  'ceo',
  'cto',
  'cfo',
  'coo',
  'cmo',
  'founder',
  'fundador',
  'fundadora',
  'co-founder',
  'cofundador',
  'diretor',
  'diretora',
  'director',
  'head',
  'vp',
  'presidente',
  'owner',
  'sócio',
  'socio',
  'gerente',
  'gestor',
  'gestora',
  'manager',
  'lead',
  'líder',
  'lider',
  'coordenador',
  'coordenadora',
];

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase().trim();
}

function localPartOf(email: string): string {
  const at = email.indexOf('@');
  return at === -1 ? email : email.slice(0, at);
}

// Conta referências a URL/domínio no texto — sinal forte de spam de link-building.
export function countLinks(text: string): number {
  const matches = text.match(/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ru|cn|top|xyz|info|biz|link|click|shop)\b/gi);
  return matches ? matches.length : 0;
}

// "Sem sentido": token só de consoantes longo, sequência longa de consoantes, ou
// alta proporção de dígitos. Pega nomes/e-mails gerados aleatoriamente por bots.
export function looksGibberish(value: string): boolean {
  const s = value.trim().toLowerCase();
  if (s.length < 6) return false;
  const letters = s.replace(/[^a-zà-ÿ]/gi, '');
  if (letters.length >= 7 && !/[aeiouyà-ÿ]/i.test(letters)) return true;
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(s)) return true;
  const digits = (s.match(/\d/g) ?? []).length;
  if (digits / s.length > 0.45) return true;
  return false;
}

function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^a-zà-ÿ]/gi, '');
  return letters.length > 15 && text === text.toUpperCase();
}

function countKeywordHits(text: string): number {
  const lower = ` ${text.toLowerCase()} `;
  let hits = 0;
  for (const kw of SPAM_KEYWORDS) {
    if (lower.includes(kw)) hits++;
  }
  return hits;
}

function assessSpam(s: LeadSignals): { spam: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let weight = 0;

  const add = (w: number, reason: string) => {
    weight += w;
    reasons.push(reason);
  };

  if (typeof s.elapsedMs === 'number' && s.elapsedMs >= 0 && s.elapsedMs < MIN_HUMAN_FILL_MS) {
    add(100, 'Preenchimento rápido demais (provável bot)');
  }

  const links = countLinks(s.message);
  if (links >= 4) add(100, 'Excesso de links na mensagem');
  else if (links >= 2) add(45, 'Vários links na mensagem');

  const kw = countKeywordHits(s.message);
  if (kw >= 3) add(100, 'Conteúdo promocional/golpe');
  else if (kw === 2) add(65, 'Vários termos promocionais');
  else if (kw === 1) add(35, 'Termo promocional na mensagem');

  const domain = domainOf(s.email);
  if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) add(70, 'E-mail descartável');

  if (looksGibberish(s.name) || looksGibberish(localPartOf(s.email))) {
    add(50, 'Nome/e-mail sem sentido');
  }

  if (s.name.trim().toLowerCase() === s.email.trim().toLowerCase() && s.name.trim()) {
    add(30, 'Nome igual ao e-mail');
  }

  if (isAllCaps(s.message)) add(25, 'Mensagem toda em maiúsculas');

  return { spam: weight >= SPAM_THRESHOLD, reasons: weight >= SPAM_THRESHOLD ? reasons : [] };
}

function qualityScore(s: LeadSignals): number {
  let score = 0;
  const domain = domainOf(s.email);
  const corporate =
    !!domain && !FREE_EMAIL_DOMAINS.has(domain) && !DISPOSABLE_EMAIL_DOMAINS.has(domain);
  if (corporate) score += 20;

  if (s.company && s.company.trim()) score += 15;
  if (s.phone && s.phone.trim()) score += 15;

  if (s.role && s.role.trim()) {
    const roleLower = s.role.toLowerCase();
    score += SENIOR_ROLE_TERMS.some((t) => roleLower.includes(t)) ? 15 : 6;
  }

  if (s.productSlug && s.productSlug.trim()) score += 10;

  const timeline = s.qualification?.timeline;
  if (timeline === 'now') score += 15;
  else if (timeline === 'month') score += 12;
  else if (timeline === 'quarter') score += 7;

  const team = s.qualification?.teamSize;
  if (team === 'large') score += 10;
  else if (team === 'medium') score += 8;
  else if (team === 'small') score += 5;
  else if (team === 'solo') score += 2;

  const useCase = s.qualification?.useCase?.trim() ?? '';
  if (useCase.length >= 12 || s.message.trim().length >= 40) score += 8;

  return Math.max(0, Math.min(100, score));
}

export function temperatureFor(score: number): Temperature {
  if (score >= 70) return 'quente';
  if (score >= 40) return 'morno';
  return 'frio';
}

export function scoreLead(signals: LeadSignals): LeadAssessment {
  const { spam, reasons } = assessSpam(signals);
  const score = qualityScore(signals);
  return {
    score,
    temperature: temperatureFor(score),
    spam,
    spamReasons: reasons,
  };
}
