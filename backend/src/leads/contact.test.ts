import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { contactController } from './leads.controller.js';
import { issueContactToken } from './contact-token.js';
import { supabase } from '../lib/supabase.js';

// E-mails únicos por execução: isolam as linhas criadas e permitem limpeza
// determinística (clients tem ON DELETE CASCADE para client_cards no banco real).
const RUN = Date.now();
const OK_EMAIL = `lead-ok-${RUN}@example.com`;
const SPAM_EMAIL = `lead-spam-${RUN}@example.com`;
const ROLLBACK_EMAIL = `lead-rollback-${RUN}@example.com`;

// Token emitido "há 10s" → passa a verificação e não dispara o sinal de bot (rápido demais).
const validToken = () => issueContactToken(Date.now() - 10_000);

const app = express();
app.use(express.json());
app.post('/public/contact', contactController);

const validBody = {
  name: 'Ana Lead',
  email: OK_EMAIL,
  message: 'Tenho interesse em avaliar a plataforma para a nossa operação interna.',
  company: 'Acme',
  role: 'Gestora de Operações',
  phone: '+55 11 98888-0000',
  product_interest: 'avali',
  qualification: { teamSize: 'medium', timeline: 'month' },
};

afterAll(async () => {
  // Limpeza por e-mail (sem .in) para funcionar tanto no banco real quanto no
  // fake em memória. interactions.client_id é ON DELETE RESTRICT no banco real:
  // remove as interações antes do client.
  const emails = [OK_EMAIL, SPAM_EMAIL, ROLLBACK_EMAIL];
  for (const email of emails) {
    const { data: rows } = await supabase.from('clients').select('id').eq('email', email);
    const clientId = (rows as { id: string }[] | null)?.[0]?.id;
    if (clientId) {
      await supabase.from('interactions').delete().eq('client_id', clientId);
    }
    await supabase.from('clients').delete().eq('email', email);
  }
});

describe('POST /api/public/contact — captação de lead em transação ACID', () => {
  it('cria client + card + notification + interação e retorna 201 (lead legítimo)', async () => {
    await request(app)
      .post('/public/contact')
      .send({ ...validBody, token: validToken() })
      .expect(201);

    const { data: clients } = await supabase
      .from('clients')
      .select('id, nome, email, empresa, cargo, telefone, score, temperatura, spam')
      .eq('email', OK_EMAIL);
    expect(clients).toHaveLength(1);
    const client = (clients as Record<string, unknown>[])[0]!;
    expect(client['empresa']).toBe('Acme');
    expect(client['cargo']).toBe('Gestora de Operações');
    expect(client['spam']).toBe(false);
    expect(Number(client['score'])).toBeGreaterThan(0);

    const clientId = client['id'] as string;

    // card na coluna default do funil (RF37)
    const { data: cards } = await supabase
      .from('client_cards')
      .select('id, client_id, column_id')
      .eq('client_id', clientId);
    expect((cards as unknown[]).length).toBeGreaterThanOrEqual(1);

    const { data: defaultCol } = await supabase
      .from('crm_columns')
      .select('id')
      .eq('is_default', true)
      .maybeSingle();
    expect((cards as { column_id: string }[])[0]!.column_id).toBe(
      (defaultCol as unknown as { id: string }).id
    );

    // notification novo_lead, não lida
    const { data: notifs } = await supabase
      .from('notifications')
      .select('id, tipo, conteudo, status')
      .eq('tipo', 'novo_lead');
    const mine = (notifs as { conteudo: string; status: string }[]).filter((n) =>
      n.conteudo.includes(OK_EMAIL)
    );
    expect(mine).toHaveLength(1);
    expect(mine[0]!.status).toBe('unread');

    // mensagem do formulário vira a interação inicial do histórico do lead
    const { data: rawInteractions } = await supabase
      .from('interactions')
      .select('tipo, conteudo, autor_id')
      .eq('client_id', clientId);
    const interactions = rawInteractions as
      | { tipo: string; conteudo: string; autor_id: string | null }[]
      | null;
    expect(interactions).toHaveLength(1);
    expect(interactions![0]!.tipo).toBe('formulario');
    expect(interactions![0]!.autor_id).toBeNull();
  });

  it('spam vira quarentena (spam=true) e notificação de segurança, ainda com 201', async () => {
    await request(app)
      .post('/public/contact')
      .send({
        name: 'promo bot',
        email: SPAM_EMAIL,
        message: 'oferecemos SEO e backlink para melhorar seu ranking: http://spam.top',
        token: validToken(),
      })
      .expect(201);

    const { data: clients } = await supabase
      .from('clients')
      .select('id, spam, spam_motivos')
      .eq('email', SPAM_EMAIL);
    expect(clients).toHaveLength(1);
    expect((clients as Record<string, unknown>[])[0]!['spam']).toBe(true);

    const { data: notifs } = await supabase
      .from('notifications')
      .select('conteudo, tipo')
      .eq('tipo', 'seguranca_controle');
    const mine = (notifs as { conteudo: string }[]).filter((n) => n.conteudo.includes(SPAM_EMAIL));
    expect(mine.length).toBeGreaterThanOrEqual(1);
  });

  it('token ausente/expirado retorna 403', async () => {
    const res = await request(app)
      .post('/public/contact')
      .send({ ...validBody, email: `no-token-${RUN}@example.com` })
      .expect(403);
    expect(res.body.code).toBe('invalid_token');
  });

  it('rollback: falha em qualquer etapa não deixa linha parcial', async () => {
    const { error } = await supabase.rpc('capture_lead', {
      p_nome: 'Rollback Lead',
      p_email: ROLLBACK_EMAIL,
      p_conteudo: '',
    } as never);
    expect(error).not.toBeNull();

    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('email', ROLLBACK_EMAIL);
    expect(clients).toHaveLength(0);
  });

  it('honeypot preenchido retorna 200 sem persistir lead', async () => {
    const email = `honeypot-${RUN}@example.com`;
    await request(app)
      .post('/public/contact')
      .send({ ...validBody, email, website: 'http://spam.bot', token: validToken() })
      .expect(200);

    const { data: clients } = await supabase.from('clients').select('id').eq('email', email);
    expect(clients).toHaveLength(0);
  });

  it('campos obrigatórios inválidos retornam 422 sem persistir', async () => {
    const res = await request(app)
      .post('/public/contact')
      .send({ name: '', email: 'invalido', message: '' })
      .expect(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
