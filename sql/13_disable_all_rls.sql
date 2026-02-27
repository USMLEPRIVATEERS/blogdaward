-- =============================================
-- WARD ACADEMY - DESABILITAR RLS EM TODAS AS TABELAS
-- Execute este script no Supabase SQL Editor
-- =============================================

-- IMPORTANTE: Como o app usa autenticacao simples (email/senha no JS)
-- e nao configura variaveis de sessao do PostgreSQL,
-- precisamos desabilitar RLS para o app funcionar.

-- =============================================
-- DESABILITAR RLS EM TODAS AS TABELAS
-- =============================================

-- Tabela principal de usuarios
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Tabelas de dados do questionario
ALTER TABLE IF EXISTS user_basic_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_usmle_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_uworld_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_uworld_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_english_level DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_anki_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_research_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_research_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_observerships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_background DISABLE ROW LEVEL SECURITY;

-- Tabelas de status e check-in
ALTER TABLE IF EXISTS user_preparation_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_checkins DISABLE ROW LEVEL SECURITY;

-- Tabelas de landmarks e schedule
ALTER TABLE IF EXISTS landmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_delays DISABLE ROW LEVEL SECURITY;

-- Tabelas de blog
ALTER TABLE IF EXISTS blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_reactions DISABLE ROW LEVEL SECURITY;

-- Tabelas de pesquisa
ALTER TABLE IF EXISTS research_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_coauthors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_stages_completed DISABLE ROW LEVEL SECURITY;

-- Tabelas de diarios
ALTER TABLE IF EXISTS study_diary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uworld_diary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uworld_system_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_stats_daily DISABLE ROW LEVEL SECURITY;

-- Tabelas de links
ALTER TABLE IF EXISTS links_repository DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_favorite_links DISABLE ROW LEVEL SECURITY;

-- Tabelas de mensagens
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICAR SE RLS ESTA DESABILITADO
-- =============================================
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Se rowsecurity = false para todas, o RLS esta desabilitado
