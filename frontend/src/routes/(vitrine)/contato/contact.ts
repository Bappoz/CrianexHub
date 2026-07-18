export type Lang = 'pt' | 'en';

export type Product = {
  id: string;
  slug: string;
  name_pt: string;
  name_en: string;
  category_pt: string | null;
  category_en: string | null;
  color?: string | null;
};

export type TeamSize = '' | 'solo' | 'small' | 'medium' | 'large';
export type Timeline = '' | 'now' | 'month' | 'quarter' | 'exploring';
export type Role = '' | 'founder' | 'manager' | 'operational' | 'other';

// Estado do wizard de captação. `product` guarda o slug do produto (ou 'other'/'').
export type WizardForm = {
  name: string;
  email: string;
  phone: string;
  product: string;
  teamSize: TeamSize;
  timeline: Timeline;
  role: Role;
  company: string;
  message: string;
  consent: boolean;
  website: string; // honeypot
};

export type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export const CHANNELS = [
  { k: 'EMAIL', v: { pt: 'contato@crianex.com', en: 'contato@crianex.com' } },
  { k: 'LINKEDIN', v: { pt: 'linkedin.com/company/crianex', en: 'linkedin.com/company/crianex' } },
  { k: 'WHATSAPP', v: { pt: 'Disponível em breve', en: 'Available soon' } },
  { k: 'HORÁRIO', v: { pt: 'Seg–Sex, 9h–18h (BRT)', en: 'Mon–Fri, 9am–6pm (BRT)' } },
] as const;

// Enum de papel → rótulo enviado como `cargo`. O rótulo contém o termo sênior
// (fundador/gestor) que o lead-scoring do backend reconhece.
export const ROLE_LABELS: Record<Exclude<Role, ''>, { pt: string; en: string }> = {
  founder: { pt: 'Fundador(a) / C-level', en: 'Founder / C-level' },
  manager: { pt: 'Gestor(a) / Líder', en: 'Manager / Lead' },
  operational: { pt: 'Operacional', en: 'Individual contributor' },
  other: { pt: 'Outro', en: 'Other' },
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function defaultForm(): WizardForm {
  return {
    name: '',
    email: '',
    phone: '',
    product: '',
    teamSize: '',
    timeline: '',
    role: '',
    company: '',
    message: '',
    consent: false,
    website: '',
  };
}

// Total de passos do wizard (0..STEP_COUNT-1). O último é a revisão + consentimento.
export const STEP_COUNT = 6;

// Gate de avanço por passo. Só identidade (0) e desafio (4) têm campos obrigatórios;
// os passos de qualificação (1–3) são opcionais. O passo de revisão (5) exige consent.
export function canAdvance(step: number, form: WizardForm): boolean {
  switch (step) {
    case 0:
      return form.name.trim().length > 0 && isValidEmail(form.email);
    case 4:
      return form.message.trim().length > 0;
    case 5:
      return form.consent;
    default:
      return true;
  }
}

// Monta o payload para POST /api/public/contact. O token anti-bot NÃO entra aqui
// (é buscado à parte e mesclado no envio), mantendo esta função pura e testável.
export function buildPayload(form: WizardForm): Record<string, unknown> {
  const qualification: Record<string, string> = {};
  if (form.teamSize) qualification.teamSize = form.teamSize;
  if (form.timeline) qualification.timeline = form.timeline;

  return {
    name: form.name,
    email: form.email,
    ...(form.phone ? { phone: form.phone } : {}),
    ...(form.company ? { company: form.company } : {}),
    ...(form.role ? { role: ROLE_LABELS[form.role].pt } : {}),
    ...(form.product && form.product !== 'other' ? { product_interest: form.product } : {}),
    message: form.message,
    ...(Object.keys(qualification).length ? { qualification } : {}),
    website: form.website,
  };
}

export function resolveStatus(httpStatus: number): {
  status: SubmitStatus;
  errorKey: 'rate' | 'token' | 'generic' | null;
} {
  if (httpStatus === 201 || httpStatus === 200) return { status: 'success', errorKey: null };
  if (httpStatus === 429) return { status: 'error', errorKey: 'rate' };
  if (httpStatus === 403) return { status: 'error', errorKey: 'token' };
  return { status: 'error', errorKey: 'generic' };
}
