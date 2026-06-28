-- pgTAP tests for notifications table (sub-issue de schema da F07 / CP9)
-- Run with: supabase test db
BEGIN;

SELECT plan(20);

-- ── Schema: notifications ──────────────────────────────────────────────────────
SELECT has_table('public', 'notifications', 'notifications table exists');

SELECT has_column('public', 'notifications', 'id',         'notifications has id');
SELECT has_column('public', 'notifications', 'tipo',       'notifications has tipo');
SELECT has_column('public', 'notifications', 'conteudo',   'notifications has conteudo');
SELECT has_column('public', 'notifications', 'status',     'notifications has status');
SELECT has_column('public', 'notifications', 'created_at', 'notifications has created_at');

SELECT col_not_null('public', 'notifications', 'tipo',       'notifications.tipo is NOT NULL');
SELECT col_not_null('public', 'notifications', 'conteudo',   'notifications.conteudo is NOT NULL');
SELECT col_not_null('public', 'notifications', 'status',     'notifications.status is NOT NULL');
SELECT col_not_null('public', 'notifications', 'created_at', 'notifications.created_at is NOT NULL');

SELECT col_default_is('public', 'notifications', 'status', 'unread',
  'notifications.status defaults to unread');

-- ── Index (RNF03 — listagem por status/data em ≤ 2s) ───────────────────────────
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = 'notifications'
            AND indexname = 'notifications_status_created_at_idx'),
  'composite index on (status, created_at) exists'
);

-- ── RLS enabled ────────────────────────────────────────────────────────────────
SELECT ok(
  (SELECT relrowsecurity FROM pg_class
   WHERE relname = 'notifications' AND relnamespace = 'public'::regnamespace),
  'RLS is enabled on notifications'
);

-- ── Policy & privileges (RNF09 — admin-only) ───────────────────────────────────
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'notifications'
            AND policyname = 'notifications_owner_all'),
  'owner-only policy exists on notifications'
);

SELECT ok(NOT has_table_privilege('anon', 'public.notifications', 'SELECT'),
  'anon has no SELECT on notifications');
SELECT ok(NOT has_table_privilege('anon', 'public.notifications', 'INSERT'),
  'anon has no INSERT on notifications');
SELECT ok(has_table_privilege('authenticated', 'public.notifications', 'SELECT'),
  'authenticated has SELECT on notifications');

-- ── Constraints ────────────────────────────────────────────────────────────────
SELECT throws_ok(
  $$INSERT INTO public.notifications (tipo, conteudo, status)
    VALUES ('novo_lead', 'Novo lead capturado', 'invalido')$$,
  '23514',
  NULL,
  'invalid notifications.status rejected by CHECK constraint'
);

SELECT throws_ok(
  $$INSERT INTO public.notifications (tipo, conteudo) VALUES ('', 'x')$$,
  '23514',
  NULL,
  'empty notifications.tipo rejected by CHECK constraint'
);

-- default status applies on insert
INSERT INTO public.notifications (tipo, conteudo)
VALUES ('novo_lead', 'Novo lead capturado');

SELECT is(
  (SELECT status FROM public.notifications WHERE conteudo = 'Novo lead capturado'),
  'unread',
  'inserted notification defaults to status unread'
);

SELECT * FROM finish();
ROLLBACK;
