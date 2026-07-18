// Helpers puros do CRM (F19/F20/F21 · CP1) — portados do protótipo de alta fidelidade
// (gh-pages/docusaurus/static/proto/iteracao-2/PrototipoCrianexCRM/crm-data.js) e
// adaptados ao modelo de dados real do backend (1 lead = 1 produto vinculado, sem
// conceito de "pedidos" múltiplos por lead). Mantidos fora dos componentes para
// permitir testes unitários (Vitest, node env).

export function initials(name: string): string {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function phoneDigits(phone: string | null | undefined): string {
  return (phone || '').replace(/\D/g, '');
}

// Link do WhatsApp com mensagem pronta para enviar (wa.me). Retorna null quando o
// lead não tem telefone cadastrado, para o chamador poder ocultar/desabilitar o botão.
export function waLink(
  name: string,
  phone: string | null | undefined,
  msg?: string
): string | null {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  const text = encodeURIComponent(msg || `Olá ${name}, aqui é da Crianex. Tudo bem?`);
  return `https://wa.me/${digits}?text=${text}`;
}

// mailto: com assunto e corpo pré-preenchidos. Retorna null sem e-mail cadastrado.
export function mailLink(
  name: string,
  email: string | null | undefined,
  subject?: string,
  body?: string
): string | null {
  if (!email) return null;
  const s = encodeURIComponent(subject || 'Crianex — sobre sua solicitação');
  const b = encodeURIComponent(body || `Olá ${name},\n\n`);
  return `mailto:${email}?subject=${s}&body=${b}`;
}

// Tempo relativo curto no estilo do protótipo/central de notificações: "agora", "14m", "2h", "3d".
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// Lead "parado" — mais de 7 dias sem interação registrada (ou nunca teve nenhuma).
export function isStale(lastInteraction: string | null | undefined): boolean {
  if (!lastInteraction) return true;
  const days = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 7;
}

export type Temperatura = 'quente' | 'morno' | 'frio';

// Metadados visuais da temperatura do lead (score de qualificação da captação).
// Cores contidas, alinhadas à paleta: pink=quente, amber=morno, slate=frio.
export function tempMeta(t: Temperatura | string | null | undefined): {
  label: string;
  color: string;
} {
  switch (t) {
    case 'quente':
      return { label: 'Quente', color: '#e71f84' };
    case 'morno':
      return { label: 'Morno', color: '#f59e0b' };
    default:
      return { label: 'Frio', color: '#64748b' };
  }
}

export function teamSizeLabel(v: string | null | undefined): string {
  switch (v) {
    case 'solo':
      return 'Só a pessoa';
    case 'small':
      return '2–10 pessoas';
    case 'medium':
      return '11–50 pessoas';
    case 'large':
      return '50+ pessoas';
    default:
      return '';
  }
}

export function timelineLabel(v: string | null | undefined): string {
  switch (v) {
    case 'now':
      return 'Quer começar agora';
    case 'month':
      return 'Começar este mês';
    case 'quarter':
      return 'Começar este trimestre';
    case 'exploring':
      return 'Ainda explorando';
    default:
      return '';
  }
}

export type CsvLead = {
  name: string;
  email: string;
  phone: string | null;
  stageTitle: string;
  responsible_name: string | null;
  product_name: string | null;
  status: string;
  last_interaction: string | null;
};

// CSV export (mesmo formato/escaping do protótipo — ; como separador, aspas quando
// necessário, BOM UTF-8 no download para abrir corretamente no Excel pt-BR).
export function toCSV(leads: CsvLead[]): string {
  const head = [
    'Nome',
    'E-mail',
    'Telefone',
    'Estágio',
    'Responsável',
    'Produto',
    'Status',
    'Última interação',
  ];
  const rows: (string | number)[][] = [head];
  for (const l of leads) {
    rows.push([
      l.name,
      l.email,
      l.phone || '',
      l.stageTitle,
      l.responsible_name || '',
      l.product_name || '',
      l.status,
      l.last_interaction || '',
    ]);
  }
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '');
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(';')
    )
    .join('\n');
}

export function downloadCSV(filename: string, text: string): void {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
