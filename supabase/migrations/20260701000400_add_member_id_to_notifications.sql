-- Migration: add member_id (destinatário específico) to notifications
-- Ref: F19 — atribuir responsável a um lead do CRM passa a notificar
-- especificamente esse membro. NULL preserva o comportamento atual
-- (notificação global, visível a todo administrador com acesso ao módulo).

ALTER TABLE public.notifications
  ADD COLUMN member_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.notifications.member_id IS
  'Membro destinatário específico (ex.: responsável atribuído a um card do CRM). '
  'NULL = notificação global, visível a qualquer administrador com acesso ao módulo.';

CREATE INDEX notifications_member_id_idx ON public.notifications (member_id);
