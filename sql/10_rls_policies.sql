-- =============================================
-- WARD ACADEMY - POLITICAS DE SEGURANCA RLS
-- Row Level Security para proteger dados
-- =============================================

-- IMPORTANTE: Execute este arquivo DEPOIS de criar todas as tabelas
-- O RLS garante que cada usuario so veja seus proprios dados

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preparation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_basic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usmle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_uworld_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_uworld_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_english_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_anki_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_research_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_observerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE landmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_coauthors ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE uworld_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE uworld_system_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE links_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCAO HELPER: Verificar se usuario e mentor
-- =============================================
CREATE OR REPLACE FUNCTION is_mentor(user_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_role LIKE 'mentor_%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- POLITICAS PARA USERS
-- =============================================

-- Usuarios podem ver seus proprios dados
CREATE POLICY users_select_own ON users
    FOR SELECT USING (id::text = current_setting('app.current_user_id', true));

-- Mentores podem ver todos os usuarios
CREATE POLICY users_select_mentor ON users
    FOR SELECT USING (
        is_mentor(current_setting('app.current_user_role', true))
    );

-- Usuarios podem atualizar seus proprios dados
CREATE POLICY users_update_own ON users
    FOR UPDATE USING (id::text = current_setting('app.current_user_id', true));

-- Apenas mentor_marcos pode inserir/deletar usuarios
CREATE POLICY users_insert_admin ON users
    FOR INSERT WITH CHECK (
        current_setting('app.current_user_role', true) = 'mentor_marcos'
    );

CREATE POLICY users_delete_admin ON users
    FOR DELETE USING (
        current_setting('app.current_user_role', true) = 'mentor_marcos'
    );

-- =============================================
-- POLITICAS PARA DADOS DO USUARIO (questionario)
-- =============================================

-- Padrao: usuario ve seus dados, mentores veem todos
CREATE POLICY user_basic_data_select ON user_basic_data
    FOR SELECT USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY user_basic_data_insert ON user_basic_data
    FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY user_basic_data_update ON user_basic_data
    FOR UPDATE USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

-- Aplicar mesmo padrao para outras tabelas de dados do usuario
-- (Repetir para cada tabela de user_data)

CREATE POLICY user_usmle_data_all ON user_usmle_data FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_uworld_data_all ON user_uworld_data FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_uworld_progress_all ON user_uworld_progress FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_english_level_all ON user_english_level FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_anki_data_all ON user_anki_data FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_research_data_all ON user_research_data FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_observerships_all ON user_observerships FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_background_all ON user_background FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

-- =============================================
-- POLITICAS PARA LANDMARKS
-- =============================================

CREATE POLICY landmarks_select ON landmarks
    FOR SELECT USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY landmarks_insert ON landmarks
    FOR INSERT WITH CHECK (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY landmarks_update ON landmarks
    FOR UPDATE USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY landmarks_delete ON landmarks
    FOR DELETE USING (
        is_mentor(current_setting('app.current_user_role', true))
    );

-- =============================================
-- POLITICAS PARA SCHEDULES
-- =============================================

CREATE POLICY schedules_select ON schedules
    FOR SELECT USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY schedules_insert ON schedules
    FOR INSERT WITH CHECK (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY schedules_update ON schedules
    FOR UPDATE USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY schedules_delete ON schedules
    FOR DELETE USING (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY schedule_delays_all ON schedule_delays FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

-- =============================================
-- POLITICAS PARA BLOG
-- =============================================

-- Todos podem ver posts
CREATE POLICY blog_posts_select ON blog_posts
    FOR SELECT USING (is_deleted = FALSE);

-- Usuarios podem criar posts
CREATE POLICY blog_posts_insert ON blog_posts
    FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

-- Usuarios podem editar/deletar seus proprios posts, mentores podem tudo
CREATE POLICY blog_posts_update ON blog_posts
    FOR UPDATE USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY blog_comments_select ON blog_comments
    FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY blog_comments_insert ON blog_comments
    FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY blog_comments_update ON blog_comments
    FOR UPDATE USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY blog_reactions_all ON blog_reactions FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
);

-- =============================================
-- POLITICAS PARA RESEARCH
-- =============================================

-- Usuarios veem projetos onde sao participantes
CREATE POLICY research_projects_select ON research_projects
    FOR SELECT USING (
        current_setting('app.current_user_id', true)::bigint = ANY(participants)
        OR created_by::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY research_projects_insert ON research_projects
    FOR INSERT WITH CHECK (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY research_projects_update ON research_projects
    FOR UPDATE USING (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY research_tasks_all ON research_tasks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM research_projects
        WHERE id = research_tasks.project_id
        AND (
            current_setting('app.current_user_id', true)::bigint = ANY(participants)
            OR is_mentor(current_setting('app.current_user_role', true))
        )
    )
);

-- =============================================
-- POLITICAS PARA DIARIES
-- =============================================

CREATE POLICY study_diary_all ON study_diary FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY uworld_diary_all ON uworld_diary FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY uworld_system_performance_all ON uworld_system_performance FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY study_stats_daily_all ON study_stats_daily FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

-- =============================================
-- POLITICAS PARA LINKS
-- =============================================

-- Todos podem ver links
CREATE POLICY links_repository_select ON links_repository
    FOR SELECT USING (is_active = TRUE);

-- Mentores podem gerenciar links
CREATE POLICY links_repository_insert ON links_repository
    FOR INSERT WITH CHECK (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY links_repository_update ON links_repository
    FOR UPDATE USING (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY user_favorite_links_all ON user_favorite_links FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
);

-- =============================================
-- POLITICAS PARA MESSAGES
-- =============================================

CREATE POLICY messages_select ON messages
    FOR SELECT USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR created_by::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY messages_insert ON messages
    FOR INSERT WITH CHECK (
        is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY messages_update ON messages
    FOR UPDATE USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR is_mentor(current_setting('app.current_user_role', true))
    );

CREATE POLICY notifications_all ON notifications FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
);

-- =============================================
-- POLITICAS PARA OUTRAS TABELAS
-- =============================================

CREATE POLICY user_preparation_status_all ON user_preparation_status FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY daily_checkins_all ON daily_checkins FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY user_research_contacts_all ON user_research_contacts FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY research_coauthors_all ON research_coauthors FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);

CREATE POLICY research_notes_all ON research_notes FOR ALL USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR is_mentor(current_setting('app.current_user_role', true))
);
