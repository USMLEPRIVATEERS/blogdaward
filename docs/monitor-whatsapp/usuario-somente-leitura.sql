-- ============================================================================
--  Usuario SO DE LEITURA para o monitor (opcional, recomendado)
--
--  O script roda a cada 20 minutos no seu PC. Em vez de dar a ele a chave
--  service_role (que pode tudo), crie um usuario que so consegue LER as cinco
--  tabelas de que ele precisa. Rode no SQL Editor do Supabase trocando a senha.
--  A conexao fica em Project Settings > Database > Connection string
--  (use o "Session pooler"), com este usuario e esta senha.
-- ============================================================================

CREATE ROLE monitor_ward LOGIN PASSWORD 'TROQUE-POR-UMA-SENHA-FORTE';

GRANT USAGE ON SCHEMA public TO monitor_ward;
GRANT SELECT ON public.users, public.landmarks, public.scheduled_calls,
                public.daily_checkins, public.uworld_diary TO monitor_ward;

-- Para desfazer:
--   REVOKE ALL ON public.users, public.landmarks, public.scheduled_calls,
--                 public.daily_checkins, public.uworld_diary FROM monitor_ward;
--   REVOKE USAGE ON SCHEMA public FROM monitor_ward;
--   DROP ROLE monitor_ward;
