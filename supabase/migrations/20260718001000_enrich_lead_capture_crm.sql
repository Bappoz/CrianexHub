-- Migration: enriquece a captação de lead → CRM (F19)
--
-- 1) Adiciona a `clients` os campos que o CRM realmente precisa e que hoje se
--    perdem dentro do texto da notificação: empresa, cargo, origem, além de
--    score de qualificação, temperatura, flag de spam e o snapshot das respostas
--    do wizard de captação (qualificacao jsonb).
-- 2) Remove a tabela `leads` — ela ficou órfã quando a captação passou a usar
--    clients/client_cards (capture_lead). Nenhum código de runtime a lê/escreve.
-- 3) Reescreve capture_lead para persistir todos esses campos, resolver o produto
--    pelo slug (o card antes nascia sem produto) e rotear spam para "quarentena"
--    (spam=true → fora do board, notificação de segurança em vez de novo_lead).

-- ── 1) Novos campos em clients ───────────────────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS empresa      text,
  ADD COLUMN IF NOT EXISTS cargo        text,
  ADD COLUMN IF NOT EXISTS origem       text,
  ADD COLUMN IF NOT EXISTS score        integer NOT NULL DEFAULT 0
                                        CHECK (score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS temperatura  text    NOT NULL DEFAULT 'frio'
                                        CHECK (temperatura IN ('quente', 'morno', 'frio')),
  ADD COLUMN IF NOT EXISTS spam         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spam_motivos text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS qualificacao jsonb   NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.clients.score IS
  'Qualificação 0–100 calculada na captação (lead-scoring). Deriva temperatura.';
COMMENT ON COLUMN public.clients.temperatura IS
  'quente (>=70) / morno (>=40) / frio — atalho visual de prioridade no CRM.';
COMMENT ON COLUMN public.clients.spam IS
  'true = classificado como spam na captação → fica em quarentena (fora do board).';
COMMENT ON COLUMN public.clients.qualificacao IS
  'Snapshot das respostas do wizard (tamanho de equipe, prazo, orçamento, caso de uso, canal).';

-- Board lista clients ativos e não-spam por data → índice parcial cobre o caminho quente.
CREATE INDEX IF NOT EXISTS clients_board_idx
  ON public.clients (created_at DESC)
  WHERE spam = false AND status = 'ativo';

-- ── 2) Remove a tabela leads (órfã) ──────────────────────────────────────────
-- Nada de runtime a usa; a captação real vive em clients/client_cards. CASCADE
-- cobre policies/índices/grants criados junto dela.
DROP TABLE IF EXISTS public.leads CASCADE;

-- ── 3) capture_lead: persiste os novos campos + resolve produto + roteia spam ──
DROP FUNCTION IF EXISTS public.capture_lead(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.capture_lead(
  p_nome         text,
  p_email        text,
  p_conteudo     text,
  p_telefone     text    DEFAULT NULL,
  p_mensagem     text    DEFAULT NULL,
  p_empresa      text    DEFAULT NULL,
  p_cargo        text    DEFAULT NULL,
  p_origem       text    DEFAULT NULL,
  p_produto_slug text    DEFAULT NULL,
  p_qualificacao jsonb   DEFAULT '{}'::jsonb,
  p_score        integer DEFAULT 0,
  p_temperatura  text    DEFAULT 'frio',
  p_spam         boolean DEFAULT false,
  p_spam_motivos text[]  DEFAULT '{}'
)
RETURNS TABLE (client_id uuid, card_id uuid, notification_id uuid, interaction_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id       uuid;
  v_card_id         uuid;
  v_notification_id uuid;
  v_interaction_id  uuid;
  v_produto_id      uuid;
BEGIN
  -- 1) Client deduplicado por e-mail. Um visitante recorrente reaproveita a mesma
  --    pessoa (UNIQUE(email)). COALESCE preserva dados já existentes quando o novo
  --    envio vem vazio, mas atualiza score/temperatura/spam para o envio mais recente.
  INSERT INTO public.clients (
    nome, email, telefone, empresa, cargo, origem,
    qualificacao, score, temperatura, spam, spam_motivos
  )
  VALUES (
    p_nome, p_email, p_telefone, p_empresa, p_cargo, p_origem,
    COALESCE(p_qualificacao, '{}'::jsonb), p_score, p_temperatura, p_spam,
    COALESCE(p_spam_motivos, '{}')
  )
  ON CONFLICT (email) DO UPDATE
    SET nome         = EXCLUDED.nome,
        telefone     = COALESCE(EXCLUDED.telefone, public.clients.telefone),
        empresa      = COALESCE(EXCLUDED.empresa,  public.clients.empresa),
        cargo        = COALESCE(EXCLUDED.cargo,    public.clients.cargo),
        origem       = COALESCE(EXCLUDED.origem,   public.clients.origem),
        qualificacao = EXCLUDED.qualificacao,
        score        = EXCLUDED.score,
        temperatura  = EXCLUDED.temperatura,
        spam         = EXCLUDED.spam,
        spam_motivos = EXCLUDED.spam_motivos
  RETURNING id INTO v_client_id;

  -- Resolve o produto de interesse pelo slug (só publicados). Slug ausente/sem
  -- match deixa o card sem produto — melhor do que falhar a captação inteira.
  IF p_produto_slug IS NOT NULL AND length(trim(p_produto_slug)) > 0 THEN
    SELECT id INTO v_produto_id
    FROM public.products
    WHERE slug = p_produto_slug AND published = true
    LIMIT 1;
  END IF;

  -- 2) Card no board do CRM. column_id NULL → trigger resolve a coluna default
  --    (RF37/RN19). Spam também ganha card (histórico completo); o board filtra
  --    spam=false, então a quarentena nunca polui o funil.
  INSERT INTO public.client_cards (client_id, column_id, produto_vinculado)
  VALUES (v_client_id, NULL, v_produto_id)
  RETURNING id INTO v_card_id;

  -- 3) Notificação: spam vira alerta de segurança e controle; lead legítimo vira
  --    novo_lead. Ambos disparam o mesmo pg_notify → SSE em tempo real.
  INSERT INTO public.notifications (tipo, conteudo)
  VALUES (CASE WHEN p_spam THEN 'seguranca_controle' ELSE 'novo_lead' END, p_conteudo)
  RETURNING id INTO v_notification_id;

  -- 4) Mensagem original vira a primeira interação do card (autor_id NULL: veio do
  --    formulário público, não de um admin autenticado).
  IF p_mensagem IS NOT NULL AND length(trim(p_mensagem)) > 0 THEN
    INSERT INTO public.interactions (client_id, autor_id, tipo, conteudo)
    VALUES (v_client_id, NULL, 'formulario', p_mensagem)
    RETURNING id INTO v_interaction_id;
  END IF;

  RETURN QUERY SELECT v_client_id, v_card_id, v_notification_id, v_interaction_id;
END;
$$;

COMMENT ON FUNCTION public.capture_lead(text, text, text, text, text, text, text, text, text, jsonb, integer, text, boolean, text[]) IS
  'Captação pública de lead: cria/atualiza client (dedup por e-mail, com qualificação '
  'e score) + client_card (coluna default, produto resolvido por slug) + notification '
  '(novo_lead ou seguranca_controle p/ spam) + interaction inicial, atomicamente. '
  'Usada por POST /api/public/contact (F19).';

REVOKE ALL ON FUNCTION public.capture_lead(text, text, text, text, text, text, text, text, text, jsonb, integer, text, boolean, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_lead(text, text, text, text, text, text, text, text, text, jsonb, integer, text, boolean, text[]) TO service_role;
