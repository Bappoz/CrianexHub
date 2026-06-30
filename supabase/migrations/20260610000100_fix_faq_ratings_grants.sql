-- faq_ratings é gerenciada exclusivamente pelo backend (service_role).
-- RLS não é necessária aqui pois não há acesso direto do cliente; remove para simplificar.
ALTER TABLE public.faq_ratings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir avaliações públicas" ON public.faq_ratings;
DROP POLICY IF EXISTS "Permitir leitura apenas para service_role" ON public.faq_ratings;

GRANT ALL ON public.faq_ratings TO service_role;
