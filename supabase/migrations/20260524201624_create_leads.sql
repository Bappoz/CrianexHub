-- Migration: create leads table (issue #85 / CP6)
-- LGPD: minimum data only — no phone, CPF, or raw IP stored.
-- ip_hash stores SHA-256(ip_address) for rate-limit lookups only.

CREATE TABLE leads (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  email            text        NOT NULL,
  company          text,
  product_interest text,
  message          text        NOT NULL,
  status           text        NOT NULL DEFAULT 'new'
                               CHECK (status IN ('new', 'read', 'archived')),
  ip_hash          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Paginated admin listing (most recent first)
CREATE INDEX leads_created_at_idx ON leads (created_at DESC);

-- Rate-limit lookup by hashed IP
CREATE INDEX leads_ip_hash_idx ON leads (ip_hash);

-- ── Grants ───────────────────────────────────────────────────────────────────
-- Anon may insert (lead form); revoke SELECT so the table is not discoverable
-- via PostgREST/GraphQL by anon or regular authenticated users.
REVOKE SELECT ON leads FROM anon, authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Any visitor (anon) can submit a lead
CREATE POLICY leads_insert_public
  ON leads
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users with role = 'owner' can read leads.
-- (select auth.jwt()) caches the JWT once per query instead of per row.
CREATE POLICY leads_select_owner
  ON leads
  FOR SELECT
  USING ((select auth.jwt()) ->> 'role' = 'owner');
