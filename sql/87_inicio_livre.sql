-- ============================================================================
--  Ward Academy — horario de inicio livre (opcao de cada mentor)  (07/11/2026)
--
--  Em "Minhas Chamadas > Configuracoes de Agendamento" o mentor escolhe:
--    - Fixo (padrao): a janela vira blocos seguidos. 13:00-17:00 com chamadas
--      de 90 min = 13:00 e 14:30.
--    - Livre a cada 30 ou 15 min: o aluno escolhe qualquer inicio dentro da
--      janela (13:00, 13:30 ... 15:30); quando alguem marca, somem os horarios
--      que se cruzam com a chamada.
--
--  start_step_minutes NULL = fixo. Ninguem muda de modo com este SQL: todos
--  continuam no fixo ate escolherem o livre.
--
--  A plataforma ja funciona sem este SQL (tudo fica no fixo); ele so habilita
--  a opcao. Pode ser rodado de novo sem efeito nenhum.
-- ============================================================================

ALTER TABLE mentor_settings
    ADD COLUMN IF NOT EXISTS start_step_minutes INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'mentor_settings_start_step_minutes_check'
          AND conrelid = 'public.mentor_settings'::regclass
    ) THEN
        ALTER TABLE mentor_settings
            ADD CONSTRAINT mentor_settings_start_step_minutes_check
            CHECK (start_step_minutes IS NULL OR start_step_minutes BETWEEN 5 AND 120);
    END IF;
END $$;

COMMENT ON COLUMN mentor_settings.start_step_minutes IS
    'Inicio livre: o aluno escolhe o inicio a cada N minutos dentro da janela. NULL = blocos fixos (padrao).';

-- Conferencia
SELECT column_name, data_type, is_nullable
FROM   information_schema.columns
WHERE  table_name = 'mentor_settings'
ORDER  BY ordinal_position;
