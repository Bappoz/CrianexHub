// Formatação compartilhada entre as telas administrativas (dashboard, financeiro…).

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const BRL_CENTS = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat('pt-BR');

/** R$ 48.200 (sem centavos por padrão; `cents` para 2 casas). */
export function currency(v: number, cents = false): string {
  return (cents ? BRL_CENTS : BRL).format(v);
}

/** Abrevia valores grandes: 3820 → "3,8k", 1250000 → "1,3M". */
export function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1).replace('.', ',')}k`;
  return NUM.format(v);
}

export function number(v: number): string {
  return NUM.format(v);
}

/** 6.4 → "6,4%" */
export function percent(v: number, digits = 1): string {
  return `${v.toFixed(digits).replace('.', ',')}%`;
}

/** Delta com sinal: 12.3 → "+12,3%", -1.2 → "−1,2%". */
export function delta(v: number, digits = 1): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(digits).replace('.', ',')}%`;
}
