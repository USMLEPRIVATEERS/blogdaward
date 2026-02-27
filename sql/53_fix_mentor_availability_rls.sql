-- =============================================
-- CORRIGIR RLS PARA DISPONIBILIDADES DE MENTORES
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Desabilitar RLS nas tabelas de disponibilidade (se estiver habilitado)
ALTER TABLE IF EXISTS mentor_availability_regular DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_availability_specific DISABLE ROW LEVEL SECURITY;

-- OU se preferir manter RLS habilitado, criar políticas permissivas:

-- Habilitar RLS
ALTER TABLE IF EXISTS mentor_availability_regular ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_availability_specific ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS mentor_availability_regular_all ON mentor_availability_regular;
DROP POLICY IF EXISTS mentor_availability_specific_all ON mentor_availability_specific;

-- Criar políticas permissivas (todos podem ler, mentors podem modificar)
CREATE POLICY mentor_availability_regular_all ON mentor_availability_regular
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY mentor_availability_specific_all ON mentor_availability_specific
    FOR ALL USING (true) WITH CHECK (true);

-- Também corrigir tabelas relacionadas a chamadas/landmarks
ALTER TABLE IF EXISTS landmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS landmarks_all ON landmarks;
CREATE POLICY landmarks_all ON landmarks
    FOR ALL USING (true) WITH CHECK (true);

-- Tabela de agendamentos de chamadas (se existir)
ALTER TABLE IF EXISTS scheduled_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS scheduled_calls_all ON scheduled_calls;
CREATE POLICY scheduled_calls_all ON scheduled_calls
    FOR ALL USING (true) WITH CHECK (true);

-- Tabela de calls (se existir)
ALTER TABLE IF EXISTS calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calls_all ON calls;
CREATE POLICY calls_all ON calls
    FOR ALL USING (true) WITH CHECK (true);

-- Verificar status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%mentor%' OR tablename LIKE '%call%' OR tablename = 'landmarks';
