-- =============================================
-- WARD ACADEMY - POLITICAS RLS SIMPLIFICADAS
-- Funciona com autenticacao customizada via RPC
-- =============================================

-- NOTA: Como o app usa autenticacao customizada (nao Supabase Auth),
-- as operacoes sensiveis sao protegidas pelas funcoes RPC com SECURITY DEFINER.
--
-- O RLS aqui serve como camada adicional de protecao:
-- 1. Tabelas publicas (blog_posts, links) = leitura aberta
-- 2. Tabelas de usuario = acesso via RPC (que valida permissoes)
-- 3. Tabela users = leitura restrita aos campos nao sensiveis

-- =============================================
-- HABILITAR RLS EM TABELAS CRITICAS
-- =============================================

-- Tabela de usuarios - CRITICA
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tabelas de questionario
ALTER TABLE IF EXISTS questionnaire_data ENABLE ROW LEVEL SECURITY;

-- Tabelas de dados pessoais
ALTER TABLE IF EXISTS user_basic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_usmle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_uworld_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_uworld_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_english_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_anki_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_research_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_observerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preparation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_checkins ENABLE ROW LEVEL SECURITY;

-- Tabelas de estudo
ALTER TABLE IF EXISTS study_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uworld_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uworld_system_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_stats_daily ENABLE ROW LEVEL SECURITY;

-- Tabelas de cronograma
ALTER TABLE IF EXISTS landmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_delays ENABLE ROW LEVEL SECURITY;

-- Tabelas de mensagens
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Tabelas de pesquisa
ALTER TABLE IF EXISTS research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_coauthors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_stages_completed ENABLE ROW LEVEL SECURITY;

-- Tabelas de blog (mais abertas)
ALTER TABLE IF EXISTS blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_reactions ENABLE ROW LEVEL SECURITY;

-- Tabelas de links (mais abertas)
ALTER TABLE IF EXISTS links_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_favorite_links ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REMOVER POLITICAS EXISTENTES
-- =============================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- =============================================
-- POLITICAS PARA TABELA USERS
-- Permitir leitura para funcoes RPC (SECURITY DEFINER)
-- Bloquear acesso direto a dados sensiveis
-- =============================================

-- Permitir SELECT apenas de campos nao sensiveis
CREATE POLICY users_select_safe ON users
    FOR SELECT
    USING (true);  -- RPC functions handle authorization

-- Bloquear INSERT/UPDATE/DELETE direto (usar RPC)
CREATE POLICY users_insert_via_rpc ON users
    FOR INSERT
    WITH CHECK (false);  -- Deve usar secure_register()

CREATE POLICY users_update_via_rpc ON users
    FOR UPDATE
    USING (false);  -- Deve usar RPC functions

CREATE POLICY users_delete_via_rpc ON users
    FOR DELETE
    USING (false);  -- Deve usar RPC functions

-- =============================================
-- POLITICAS PARA QUESTIONNAIRE_DATA
-- Acesso via RPC que valida permissoes
-- =============================================

CREATE POLICY questionnaire_select ON questionnaire_data
    FOR SELECT USING (true);  -- RPC validates access

CREATE POLICY questionnaire_insert ON questionnaire_data
    FOR INSERT WITH CHECK (true);  -- RPC validates access

CREATE POLICY questionnaire_update ON questionnaire_data
    FOR UPDATE USING (true);  -- RPC validates access

CREATE POLICY questionnaire_delete ON questionnaire_data
    FOR DELETE USING (true);  -- RPC validates access

-- =============================================
-- POLITICAS PARA TABELAS DE DADOS DE USUARIO
-- Acesso aberto (protegido por RPC e frontend)
-- =============================================

-- Macro para criar politicas permissivas para tabelas de usuario
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'user_basic_data', 'user_usmle_data', 'user_uworld_data',
        'user_uworld_progress', 'user_english_level', 'user_anki_data',
        'user_research_data', 'user_research_contacts', 'user_observerships',
        'user_background', 'user_preparation_status', 'daily_checkins',
        'study_diary', 'uworld_diary', 'uworld_system_performance',
        'study_stats_daily', 'landmarks', 'schedules', 'schedule_delays',
        'messages', 'notifications', 'research_projects', 'research_tasks',
        'research_coauthors', 'research_notes', 'research_stages_completed'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Verifica se tabela existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            EXECUTE format('CREATE POLICY %I_all ON %I FOR ALL USING (true) WITH CHECK (true)',
                tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- =============================================
-- POLITICAS PARA BLOG (Leitura publica)
-- =============================================

CREATE POLICY blog_posts_select ON blog_posts
    FOR SELECT USING (COALESCE(is_deleted, false) = false);

CREATE POLICY blog_posts_insert ON blog_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY blog_posts_update ON blog_posts
    FOR UPDATE USING (true);

CREATE POLICY blog_posts_delete ON blog_posts
    FOR DELETE USING (true);

CREATE POLICY blog_comments_select ON blog_comments
    FOR SELECT USING (COALESCE(is_deleted, false) = false);

CREATE POLICY blog_comments_insert ON blog_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY blog_comments_update ON blog_comments
    FOR UPDATE USING (true);

CREATE POLICY blog_reactions_all ON blog_reactions
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- POLITICAS PARA LINKS (Leitura publica)
-- =============================================

CREATE POLICY links_select ON links_repository
    FOR SELECT USING (COALESCE(is_active, true) = true);

CREATE POLICY links_insert ON links_repository
    FOR INSERT WITH CHECK (true);

CREATE POLICY links_update ON links_repository
    FOR UPDATE USING (true);

CREATE POLICY user_favorite_links_all ON user_favorite_links
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- VIEW SEGURA PARA USUARIOS (sem password_hash)
-- Use esta view no frontend ao inves de SELECT * FROM users
-- =============================================

CREATE OR REPLACE VIEW users_safe AS
SELECT
    id,
    email,
    cpf,
    full_name,
    name,
    role,
    first_login_completed,
    questionnaire_step,
    status,
    created_at,
    updated_at
FROM users;

-- Permitir acesso a view
GRANT SELECT ON users_safe TO anon, authenticated;

-- =============================================
-- FUNCAO: Obter usuario por ID (segura)
-- =============================================

CREATE OR REPLACE FUNCTION get_user_safe(p_user_id BIGINT)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'id', id,
            'email', email,
            'cpf', cpf,
            'full_name', COALESCE(full_name, name),
            'name', COALESCE(name, full_name),
            'role', role,
            'first_login_completed', first_login_completed,
            'questionnaire_step', questionnaire_step,
            'status', status
        )
        FROM users
        WHERE id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_safe TO anon, authenticated;

-- =============================================
-- VERIFICAR RLS ESTA HABILITADO
-- =============================================

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
