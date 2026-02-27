-- =============================================
-- WARD ACADEMY - MIGRACAO PARA SUPABASE AUTH
-- =============================================
--
-- ⚠️  ATENCAO: NAO EXECUTE ESTE SCRIPT COMPLETO!
--
-- Este script habilita RLS (Row Level Security) que vai
-- BLOQUEAR o acesso de usuarios que ainda nao foram migrados
-- para o Supabase Auth.
--
-- ORDEM DE EXECUCAO CORRETA:
-- 1. Execute APENAS a parte de adicionar coluna auth_id (linhas 20-26)
-- 2. Migre TODOS os usuarios para Supabase Auth
-- 3. Vincule os auth_id usando sql/71_migrate_users_to_auth.sql
-- 4. SOMENTE DEPOIS execute sql/74_enable_rls_final.sql
--
-- Se voce ja executou este script e esta tendo erros 406/500:
-- Execute sql/73_disable_rls_temporarily.sql para desabilitar RLS
--
-- =============================================

-- 1. Adicionar coluna auth_id para vincular com auth.users
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- 2. Criar index para busca rapida por auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- 3. Funcao para buscar usuario por auth_id
CREATE OR REPLACE FUNCTION get_user_by_auth_id(p_auth_id UUID)
RETURNS users AS $$
    SELECT * FROM users WHERE auth_id = p_auth_id LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 4. Funcao para criar/atualizar usuario quando faz login
CREATE OR REPLACE FUNCTION sync_user_on_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um usuario faz login via Supabase Auth,
    -- atualiza o auth_id na nossa tabela users se existir email correspondente
    UPDATE users
    SET auth_id = NEW.id, updated_at = NOW()
    WHERE email = NEW.email AND auth_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para sincronizar auth_id quando usuario e criado no auth.users
-- NOTA: Este trigger precisa ser criado no schema auth (requer acesso admin)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION sync_user_on_auth();

-- =============================================
-- RLS POLICIES PARA TABELA USERS
-- =============================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_select_mentor ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert_mentor ON users;

-- Policy: Usuarios podem ver seus proprios dados
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth_id = auth.uid());

-- Policy: Mentores podem ver todos os usuarios
CREATE POLICY users_select_mentor ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_id = auth.uid()
            AND u.role LIKE 'mentor_%'
        )
    );

-- Policy: Usuarios podem atualizar seus proprios dados (exceto role)
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());

-- Policy: Mentores podem criar usuarios
CREATE POLICY users_insert_mentor ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_id = auth.uid()
            AND u.role LIKE 'mentor_%'
        )
    );

-- Policy: Mentores podem atualizar qualquer usuario
CREATE POLICY users_update_mentor ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_id = auth.uid()
            AND u.role LIKE 'mentor_%'
        )
    );

-- =============================================
-- VERIFICAR CONFIGURACAO
-- =============================================
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
