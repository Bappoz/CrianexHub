-- Seed: templates das novas features (Logs de Produtos, Financeiro, Dashboard,
-- Tickets/Suporte). Idempotente — só insere quando não há template ATIVO para o
-- tipo_evento (respeita o índice único de 1 ativo por tipo, RF15).

insert into public.notification_templates (tipo_evento, nome, conteudo, is_default, active)
select v.tipo, v.nome, v.conteudo, false, true
from (values
  ('logs_monitoramento', 'Log de produto',   'Produto {{produto}}: {{acao}}.'),
  ('financeiro',         'Financeiro',        'Financeiro — {{descricao}}.'),
  ('dashboard',          'Dashboard',         'Dashboard — {{descricao}}.'),
  ('suporte',            'Ticket de suporte', 'Ticket {{id}}: {{assunto}}.')
) as v(tipo, nome, conteudo)
where not exists (
  select 1 from public.notification_templates t
  where t.tipo_evento = v.tipo and t.active
);
