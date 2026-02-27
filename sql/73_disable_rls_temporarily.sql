-- =============================================
-- WARD ACADEMY - DESABILITAR RLS TEMPORARIAMENTE
-- Execute este script para permitir acesso enquanto
-- os usuarios nao estao migrados para Supabase Auth
-- =============================================

-- IMPORTANTE: Este script desabilita a seguranca RLS temporariamente
-- Apos migrar TODOS os usuarios para Supabase Auth, execute o script
-- 74_enable_rls_final.sql para reativar a seguranca

-- 1. Desabilitar RLS na tabela users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Desabilitar RLS em outras tabelas que podem ter sido habilitadas
ALTER TABLE IF EXISTS user_tutorials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uworld_diary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS anki_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_english DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_research DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_observership DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_background DISABLE ROW LEVEL SECURITY;

-- 3. Verificar status do RLS em todas as tabelas
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- NOTA: As policies criadas anteriormente permanecem no banco
-- mas nao serao aplicadas enquanto RLS estiver desabilitado.
-- Isso permite uma migracao gradual dos usuarios.
-- =============================================
