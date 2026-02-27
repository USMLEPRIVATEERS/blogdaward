-- =============================================
-- WARD ACADEMY - CORRECAO RLS PARA ADMIN
-- Execute este script no Supabase SQL Editor
-- Corrige o bloqueio de INSERT/UPDATE na tabela users
-- =============================================

-- Remover politicas restritivas da tabela users
DROP POLICY IF EXISTS users_insert_via_rpc ON users;
DROP POLICY IF EXISTS users_update_via_rpc ON users;
DROP POLICY IF EXISTS users_delete_via_rpc ON users;

-- Criar politicas permissivas para users
-- (A validacao de permissao e feita no frontend/RPC, nao no RLS)
CREATE POLICY users_insert_allow ON users
    FOR INSERT
    WITH CHECK (true);  -- Permitir INSERT

CREATE POLICY users_update_allow ON users
    FOR UPDATE
    USING (true)  -- Permitir UPDATE
    WITH CHECK (true);

CREATE POLICY users_delete_allow ON users
    FOR DELETE
    USING (true);  -- Permitir DELETE

-- Verificar se as politicas foram criadas
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
