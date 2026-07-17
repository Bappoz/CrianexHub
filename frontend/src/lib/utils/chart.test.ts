import { describe, it, expect } from 'vitest';
import { toPoints, smoothPath, areaPath, donutArc } from './chart';

describe('toPoints', () => {
  it('mapeia valores para largura/altura com y invertido', () => {
    const pts = toPoints([0, 10], 100, 50);
    expect(pts[0]).toEqual({ x: 0, y: 50 }); // menor valor → base
    expect(pts[1]).toEqual({ x: 100, y: 0 }); // maior valor → topo
  });

  it('centraliza ponto único', () => {
    const pts = toPoints([5], 100, 50);
    expect(pts[0]?.x).toBe(50);
  });

  it('respeita min/max fixos e padding', () => {
    const pts = toPoints([50], 100, 100, 10, 0, 100);
    // valor 50 de 0..100, innerH=80 → y = pad + innerH - 0.5*innerH = 10 + 80 - 40 = 50
    expect(pts[0]?.y).toBeCloseTo(50);
  });
});

describe('smoothPath / areaPath', () => {
  it('retorna vazio para lista vazia', () => {
    expect(smoothPath([])).toBe('');
    expect(areaPath([], 100)).toBe('');
  });

  it('gera path M/L para 2 pontos', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(d.startsWith('M')).toBe(true);
    expect(d).toContain('L');
  });

  it('usa curvas Bézier (C) para 3+ pontos', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 5, y: 8 },
      { x: 10, y: 2 },
    ]);
    expect(d).toContain('C');
  });

  it('area fecha o path (Z) até a base', () => {
    const d = areaPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      50
    );
    expect(d.trim().endsWith('Z')).toBe(true);
    expect(d).toContain('L 0 50');
  });
});

describe('donutArc', () => {
  it('divide a circunferência conforme a fração', () => {
    const { dash } = donutArc(0.25, 100);
    expect(dash).toBe('25 75');
  });
});
