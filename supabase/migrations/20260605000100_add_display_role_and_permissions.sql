alter table public.profiles
  add column if not exists display_role text default null,
  add column if not exists permissions jsonb default '{}'::jsonb;
