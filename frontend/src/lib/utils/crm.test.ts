import { describe, expect, it } from 'vitest';
import { initials, isStale, mailLink, phoneDigits, relativeTime, toCSV, waLink } from './crm';

describe('initials', () => {
  it('pega as duas primeiras iniciais em maiúsculo', () => {
    expect(initials('Carla Mendes')).toBe('CM');
    expect(initials('Diretoria')).toBe('D');
    expect(initials('')).toBe('');
  });
});

describe('phoneDigits', () => {
  it('remove tudo que não é dígito', () => {
    expect(phoneDigits('+55 11 98421-0042')).toBe('5511984210042');
    expect(phoneDigits(null)).toBe('');
  });
});

describe('waLink', () => {
  it('monta o link do wa.me com mensagem pré-preenchida', () => {
    const link = waLink('Carla', '+55 11 98421-0042');
    expect(link).toContain('https://wa.me/5511984210042?text=');
    expect(link).toContain(encodeURIComponent('Carla'));
  });

  it('retorna null sem telefone cadastrado', () => {
    expect(waLink('Carla', null)).toBeNull();
    expect(waLink('Carla', '')).toBeNull();
  });
});

describe('mailLink', () => {
  it('monta o mailto: com assunto e corpo pré-preenchidos', () => {
    const link = mailLink('Carla', 'carla@nivera.com');
    expect(link).toContain('mailto:carla@nivera.com?subject=');
    expect(link).toContain('body=');
  });

  it('retorna null sem e-mail cadastrado', () => {
    expect(mailLink('Carla', null)).toBeNull();
  });
});

describe('relativeTime', () => {
  it('retorna travessão quando não há data', () => {
    expect(relativeTime(null)).toBe('—');
  });

  it('formata minutos/horas/dias corretamente', () => {
    const now = Date.now();
    expect(relativeTime(new Date(now - 30_000).toISOString())).toBe('agora');
    expect(relativeTime(new Date(now - 5 * 60_000).toISOString())).toBe('5m');
    expect(relativeTime(new Date(now - 3 * 3_600_000).toISOString())).toBe('3h');
    expect(relativeTime(new Date(now - 2 * 86_400_000).toISOString())).toBe('2d');
  });
});

describe('isStale', () => {
  it('é true quando nunca houve interação', () => {
    expect(isStale(null)).toBe(true);
  });

  it('é true com 7+ dias sem interação, false com interação recente', () => {
    const now = Date.now();
    expect(isStale(new Date(now - 8 * 86_400_000).toISOString())).toBe(true);
    expect(isStale(new Date(now - 1 * 86_400_000).toISOString())).toBe(false);
  });
});

describe('toCSV', () => {
  it('gera cabeçalho e linhas separadas por ; com escaping de aspas', () => {
    const csv = toCSV([
      {
        name: 'Carla, Mendes',
        email: 'carla@nivera.com',
        phone: '+5511984210042',
        stageTitle: 'Novo lead',
        responsible_name: 'Joana V.',
        product_name: 'Avali',
        status: 'ativo',
        last_interaction: null,
      },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'Nome;E-mail;Telefone;Estágio;Responsável;Produto;Status;Última interação'
    );
    expect(lines[1]).toContain('"Carla, Mendes"');
  });
});
