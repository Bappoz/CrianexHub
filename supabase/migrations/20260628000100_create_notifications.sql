-- Migration: create notifications table (F07 · CP9 — Sistema de Notificações)
-- Ref: sub-issue de schema da feature #179. Base para F07 (sub-issues 2/3), F08 e F19.
-- RLS: admin-only (app_metadata.role = 'owner'), igual a clients/leads (RNF09).

CREATE TABLE public.notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text        NOT NULL CHECK (length(trim(tipo)) > 0),
  conteudo    text        NOT NULL CHECK (length(trim(conteudo)) > 0),
  status      text        NOT NULL DEFAULT 'unread'
                          CHECK (status IN ('unread', 'read')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS
  'Histórico de notificações geradas por eventos-chave (ex.: novo lead). '
  'status alterna unread/read; base para F07/F08/F19.';

-- RNF03: listagem por status + data ordenada por mais recentes em ≤ 2s.
CREATE INDEX notifications_status_created_at_idx
  ON public.notifications (status, created_at DESC);

-- ── Grants ───────────────────────────────────────────────────────────────────
-- service_role bypasses RLS (backend admin queries); authenticated is gated by
-- the owner-only policy below. anon is revoked to hide the table from PostgREST.
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
REVOKE ALL ON public.notifications FROM anon;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only owner-role admins can manage notifications (RNF09).
-- (SELECT auth.jwt()) caches the JWT once per query instead of per row.
CREATE POLICY notifications_owner_all ON public.notifications
  FOR ALL
  TO authenticated
  USING      ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role' = 'owner')
  WITH CHECK ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role' = 'owner');
