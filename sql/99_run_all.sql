-- =============================================
-- WARD ACADEMY - EXECUTAR TODOS OS SCRIPTS
-- Este arquivo executa todos os SQLs na ordem correta
-- =============================================

-- ATENCAO: No Supabase, voce precisa copiar e colar
-- o conteudo de cada arquivo individualmente,
-- pois o Supabase nao suporta \i ou INCLUDE

-- Execute na seguinte ordem:
-- 1. 01_users.sql
-- 2. 02_user_data.sql
-- 3. 03_landmarks.sql
-- 4. 04_schedules.sql
-- 5. 05_blog.sql
-- 6. 06_research.sql
-- 7. 07_diaries.sql
-- 8. 08_links.sql
-- 9. 09_messages.sql
-- 10. 10_rls_policies.sql
-- 11. 11_seed_data.sql

-- =============================================
-- ALTERNATIVA: SCRIPT COMBINADO
-- Abaixo esta todo o codigo combinado para
-- execucao em uma unica vez
-- =============================================

-- Descomente a linha abaixo para ver o progresso
-- SET client_min_messages TO NOTICE;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'WARD ACADEMY - INICIANDO SETUP';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 01_USERS.SQL
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'aluno' CHECK (role IN ('aluno', 'mentor_marcos', 'mentor_iria', 'mentor_guilherme', 'mentor_fernando')),
    first_login_completed BOOLEAN DEFAULT FALSE,
    questionnaire_step INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preparation_status (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    currently_preparing_for VARCHAR(50) CHECK (currently_preparing_for IN ('step1', 'step2ck', 'step3', 'oet', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS daily_checkins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('tranquilo', 'preciso_ajuda', 'parado', 'custom')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN RAISE NOTICE 'Tabela users criada'; END $$;

-- =============================================
-- Continue com os outros arquivos...
-- Por limitacao de tamanho, copie cada arquivo
-- individualmente no Supabase SQL Editor
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANTE: Este arquivo e apenas um guia';
    RAISE NOTICE 'Execute cada arquivo SQL individualmente';
    RAISE NOTICE 'na ordem especificada no README';
    RAISE NOTICE '========================================';
END $$;
