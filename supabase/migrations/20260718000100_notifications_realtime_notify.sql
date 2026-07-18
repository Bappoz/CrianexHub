-- Migration: trigger pg_notify em notifications (tempo real para o microserviço
-- crianex-notify). A cada INSERT, emite a linha no canal 'crianex_notifications';
-- o serviço Rust escuta via LISTEN e faz push aos clientes SSE.
-- Funciona para QUALQUER produtor (backend via /events e a RPC capture_lead).

create or replace function public.notify_new_notification()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify('crianex_notifications', row_to_json(new)::text);
  return new;
end;
$$;

drop trigger if exists notifications_pg_notify on public.notifications;
create trigger notifications_pg_notify
  after insert on public.notifications
  for each row execute function public.notify_new_notification();
