// Helpers de geometria para os gráficos SVG inline do admin (sem dependências).

export interface Pt {
  x: number;
  y: number;
}

/**
 * Mapeia uma série de valores para pontos num plano width×height (y invertido),
 * com padding vertical opcional. `min`/`max` fixos permitem alinhar escalas.
 */
export function toPoints(
  values: number[],
  width: number,
  height: number,
  pad = 0,
  min?: number,
  max?: number
): Pt[] {
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const n = values.length;
  const innerH = height - pad * 2;
  return values.map((v, i) => ({
    x: n === 1 ? width / 2 : (i / (n - 1)) * width,
    y: pad + innerH - ((v - lo) / span) * innerH,
  }));
}

/** Path suave (Catmull-Rom → Bézier cúbica). Curvas orgânicas, estilo Apple. */
export function smoothPath(pts: Pt[]): string {
  const first = pts[0];
  if (!first) return '';
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'} ${r(p.x)} ${r(p.y)}`).join(' ');
  let d = `M ${r(first.x)} ${r(first.y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p0 = pts[i - 1] ?? p1;
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r(cp1x)} ${r(cp1y)} ${r(cp2x)} ${r(cp2y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}

/** Área fechada sob a curva suave, até a base (`height`). */
export function areaPath(pts: Pt[], height: number): string {
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return '';
  const line = smoothPath(pts);
  return `${line} L ${r(last.x)} ${r(height)} L ${r(first.x)} ${r(height)} Z`;
}

/** Arco de donut como stroke-dasharray. Retorna offset/len para um circulo. */
export function donutArc(fraction: number, circumference: number): { dash: string } {
  const len = fraction * circumference;
  return { dash: `${r(len)} ${r(circumference - len)}` };
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}
