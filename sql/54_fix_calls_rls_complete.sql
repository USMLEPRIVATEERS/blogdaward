-- =============================================
-- CORRIGIR RLS PARA SISTEMA DE CHAMADAS E MENTORES
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- IMPORTANTE: Execute este SQL COMPLETO para corrigir todos os problemas
-- de agendamento de chamadas com mentores

-- =============================================
-- 1. TABELA SCHEDULED_CALLS
-- =============================================

-- Habilitar RLS
ALTER TABLE IF EXISTS scheduled_calls ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS scheduled_calls_all ON scheduled_calls;
DROP POLICY IF EXISTS scheduled_calls_select ON scheduled_calls;
DROP POLICY IF EXISTS scheduled_calls_insert ON scheduled_calls;
DROP POLICY IF EXISTS scheduled_calls_update ON scheduled_calls;
DROP POLICY IF EXISTS scheduled_calls_delete ON scheduled_calls;

-- Criar política permissiva
CREATE POLICY scheduled_calls_all ON scheduled_calls
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 2. TABELA MENTOR_AVAILABILITY_REGULAR
-- =============================================

-- Habilitar RLS
ALTER TABLE IF EXISTS mentor_availability_regular ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS mentor_availability_regular_all ON mentor_availability_regular;
DROP POLICY IF EXISTS mentor_availability_regular_select ON mentor_availability_regular;
DROP POLICY IF EXISTS mentor_availability_regular_insert ON mentor_availability_regular;
DROP POLICY IF EXISTS mentor_availability_regular_update ON mentor_availability_regular;
DROP POLICY IF EXISTS mentor_availability_regular_delete ON mentor_availability_regular;

-- Criar política permissiva
CREATE POLICY mentor_availability_regular_all ON mentor_availability_regular
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. TABELA MENTOR_AVAILABILITY_SPECIFIC
-- =============================================

-- Habilitar RLS
ALTER TABLE IF EXISTS mentor_availability_specific ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS mentor_availability_specific_all ON mentor_availability_specific;
DROP POLICY IF EXISTS mentor_availability_specific_select ON mentor_availability_specific;
DROP POLICY IF EXISTS mentor_availability_specific_insert ON mentor_availability_specific;
DROP POLICY IF EXISTS mentor_availability_specific_update ON mentor_availability_specific;
DROP POLICY IF EXISTS mentor_availability_specific_delete ON mentor_availability_specific;

-- Criar política permissiva
CREATE POLICY mentor_availability_specific_all ON mentor_availability_specific
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. TABELA MENTOR_SETTINGS
-- =============================================

-- Habilitar RLS
ALTER TABLE IF EXISTS mentor_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS mentor_settings_all ON mentor_settings;
DROP POLICY IF EXISTS mentor_settings_select ON mentor_settings;
DROP POLICY IF EXISTS mentor_settings_insert ON mentor_settings;
DROP POLICY IF EXISTS mentor_settings_update ON mentor_settings;
DROP POLICY IF EXISTS mentor_settings_delete ON mentor_settings;

-- Criar política permissiva
CREATE POLICY mentor_settings_all ON mentor_settings
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 5. TABELA LANDMARKS (já deve ter política, mas garantir)
-- =============================================

-- Habilitar RLS
ALTER TABLE IF EXISTS landmarks ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS landmarks_all ON landmarks;
DROP POLICY IF EXISTS landmarks_select ON landmarks;
DROP POLICY IF EXISTS landmarks_insert ON landmarks;
DROP POLICY IF EXISTS landmarks_update ON landmarks;
DROP POLICY IF EXISTS landmarks_delete ON landmarks;

-- Criar política permissiva
CREATE POLICY landmarks_all ON landmarks
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 6. TABELA CALLS (se existir)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calls' AND table_schema = 'public') THEN
        ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS calls_all ON calls;
        CREATE POLICY calls_all ON calls FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =============================================
-- 7. VERIFICAR STATUS FINAL
-- =============================================

SELECT
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as num_policies
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'scheduled_calls',
    'mentor_availability_regular',
    'mentor_availability_specific',
    'mentor_settings',
    'landmarks',
    'calls'
)
ORDER BY tablename;

-- =============================================
-- PRONTO! Agora os agendamentos devem funcionar
-- =============================================
