-- Fix call_reports RLS policies
-- A tabela tem RLS habilitado mas as políticas foram removidas

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view call reports" ON call_reports;
DROP POLICY IF EXISTS "Mentors can create reports" ON call_reports;
DROP POLICY IF EXISTS "Mentors can update reports" ON call_reports;
DROP POLICY IF EXISTS "Mentors can delete reports" ON call_reports;
DROP POLICY IF EXISTS "call_reports_all" ON call_reports;

-- Criar política permissiva para todas as operações
CREATE POLICY call_reports_all ON call_reports
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verificar que a política foi criada
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'call_reports';
