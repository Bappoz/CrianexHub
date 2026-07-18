import { describe, it, expect } from 'vitest';
import {
  scoreLead,
  countLinks,
  looksGibberish,
  temperatureFor,
  MIN_HUMAN_FILL_MS,
  type LeadSignals,
} from './lead-scoring.js';

const base: LeadSignals = {
  name: 'Marina Pereira',
  email: 'marina@acme.com.br',
  message: 'Gostaria de entender como a plataforma se integra ao nosso fluxo atual.',
  elapsedMs: 30_000,
};

describe('countLinks', () => {
  it('conta URLs e domínios soltos', () => {
    expect(countLinks('veja http://a.com e www.b.net e c.xyz')).toBeGreaterThanOrEqual(3);
  });
  it('zero para texto sem links', () => {
    expect(countLinks('quero saber mais sobre o produto')).toBe(0);
  });
});

describe('looksGibberish', () => {
  it('detecta sequência de consoantes', () => {
    expect(looksGibberish('xkcdfghjqz')).toBe(true);
  });
  it('detecta alta proporção de dígitos', () => {
    expect(looksGibberish('a1b2c3d4e5')).toBe(true);
  });
  it('nomes reais não são gibberish', () => {
    expect(looksGibberish('Marina Pereira')).toBe(false);
    expect(looksGibberish('João')).toBe(false);
  });
});

describe('temperatureFor', () => {
  it('mapeia faixas', () => {
    expect(temperatureFor(85)).toBe('quente');
    expect(temperatureFor(70)).toBe('quente');
    expect(temperatureFor(55)).toBe('morno');
    expect(temperatureFor(40)).toBe('morno');
    expect(temperatureFor(20)).toBe('frio');
  });
});

describe('scoreLead — spam', () => {
  it('preenchimento rápido demais = spam', () => {
    const r = scoreLead({ ...base, elapsedMs: 500 });
    expect(r.spam).toBe(true);
    expect(r.spamReasons.join(' ')).toMatch(/rápido/i);
  });

  it('exatamente no limite mínimo NÃO é spam por tempo', () => {
    const r = scoreLead({ ...base, elapsedMs: MIN_HUMAN_FILL_MS });
    expect(r.spam).toBe(false);
  });

  it('excesso de links = spam', () => {
    const r = scoreLead({
      ...base,
      message: 'compre em http://a.com http://b.com http://c.com http://d.com',
    });
    expect(r.spam).toBe(true);
  });

  it('conteúdo promocional (3 keywords) = spam', () => {
    const r = scoreLead({
      ...base,
      message: 'oferecemos SEO e backlink para melhorar seu ranking no Google',
    });
    expect(r.spam).toBe(true);
  });

  it('2 keywords sozinhas não bastam (evita falso positivo)', () => {
    const r = scoreLead({
      ...base,
      message: 'trabalho com marketing digital e queria entender apostas de mercado do produto',
    });
    expect(r.spam).toBe(false);
  });

  it('e-mail descartável + gibberish = spam', () => {
    const r = scoreLead({
      ...base,
      name: 'xzkjqwbc',
      email: 'xzkjqwbc@mailinator.com',
    });
    expect(r.spam).toBe(true);
  });

  it('lead legítimo não é spam', () => {
    expect(scoreLead(base).spam).toBe(false);
  });
});

describe('scoreLead — qualidade', () => {
  it('lead corporativo completo é quente', () => {
    const r = scoreLead({
      ...base,
      company: 'Acme',
      phone: '+55 11 99999-0000',
      role: 'Diretora de Operações',
      productSlug: 'avali',
      qualification: { timeline: 'now', teamSize: 'large', useCase: 'Onboarding de 200 pessoas' },
    });
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.temperature).toBe('quente');
    expect(r.spam).toBe(false);
  });

  it('e-mail gratuito sem qualificação é frio', () => {
    const r = scoreLead({
      name: 'Ana',
      email: 'ana@gmail.com',
      message: 'oi',
      elapsedMs: 10_000,
    });
    expect(r.score).toBeLessThan(40);
    expect(r.temperature).toBe('frio');
  });

  it('score nunca passa de 100', () => {
    const r = scoreLead({
      ...base,
      company: 'Acme',
      phone: '+55 11 99999-0000',
      role: 'CEO',
      productSlug: 'avali',
      qualification: { timeline: 'now', teamSize: 'large', useCase: 'x'.repeat(50) },
    });
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
