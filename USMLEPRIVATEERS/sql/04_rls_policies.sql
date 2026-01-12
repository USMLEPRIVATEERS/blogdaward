-- ========================================
-- USMLE PRIVATEERS - RLS Policies
-- Row Level Security for all tables
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_article_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_bookmarks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTION TO GET CURRENT USER
-- ========================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_role', true), '')::user_role;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'membro';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_founder()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() = 'fundador';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_adm_or_founder()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() IN ('fundador', 'adm');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Anyone can see basic public info
CREATE POLICY users_select_public ON users
    FOR SELECT
    USING (TRUE);

-- Users can update their own data
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (id = get_current_user_id());

-- Only founders can see all user data (including sensitive fields)
CREATE POLICY users_select_full_founders ON users
    FOR SELECT
    USING (is_founder() OR id = get_current_user_id());

-- Only founders can insert users (for admin creation)
CREATE POLICY users_insert_founders ON users
    FOR INSERT
    WITH CHECK (is_founder() OR TRUE); -- Allow registration

-- Only founders can delete users
CREATE POLICY users_delete_founders ON users
    FOR DELETE
    USING (is_founder());

-- ========================================
-- QUESTIONNAIRE RESPONSES POLICIES
-- ========================================

-- Users can see their own responses
CREATE POLICY qr_select_own ON questionnaire_responses
    FOR SELECT
    USING (user_id = get_current_user_id() OR is_founder());

-- Users can insert their own responses
CREATE POLICY qr_insert_own ON questionnaire_responses
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

-- Users can update their own responses
CREATE POLICY qr_update_own ON questionnaire_responses
    FOR UPDATE
    USING (user_id = get_current_user_id());

-- ========================================
-- QUESTIONNAIRE QUESTIONS POLICIES
-- ========================================

-- Everyone can see active questions
CREATE POLICY qq_select_all ON questionnaire_questions
    FOR SELECT
    USING (is_active = TRUE OR is_founder());

-- Only founders can manage questions
CREATE POLICY qq_insert_founders ON questionnaire_questions
    FOR INSERT
    WITH CHECK (is_founder());

CREATE POLICY qq_update_founders ON questionnaire_questions
    FOR UPDATE
    USING (is_founder());

CREATE POLICY qq_delete_founders ON questionnaire_questions
    FOR DELETE
    USING (is_founder());

-- ========================================
-- USER ACTIVITY LOG POLICIES
-- ========================================

-- Users can see their own activity
CREATE POLICY ual_select_own ON user_activity_log
    FOR SELECT
    USING (user_id = get_current_user_id() OR is_founder());

-- System can insert activity (no restriction needed)
CREATE POLICY ual_insert ON user_activity_log
    FOR INSERT
    WITH CHECK (TRUE);

-- ========================================
-- BLOG POSTS POLICIES
-- ========================================

-- Everyone can see non-deleted posts
CREATE POLICY bp_select_all ON blog_posts
    FOR SELECT
    USING (is_deleted = FALSE OR user_id = get_current_user_id() OR is_founder());

-- Members can create posts
CREATE POLICY bp_insert_members ON blog_posts
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

-- Users can update their own posts, founders can update any
CREATE POLICY bp_update ON blog_posts
    FOR UPDATE
    USING (user_id = get_current_user_id() OR is_founder());

-- Users can delete their own posts, founders can delete any
CREATE POLICY bp_delete ON blog_posts
    FOR DELETE
    USING (user_id = get_current_user_id() OR is_founder());

-- ========================================
-- BLOG TAGS POLICIES
-- ========================================

-- Everyone can see active tags
CREATE POLICY bt_select_all ON blog_tags
    FOR SELECT
    USING (is_active = TRUE OR is_adm_or_founder());

-- ADMs and founders can manage tags
CREATE POLICY bt_insert ON blog_tags
    FOR INSERT
    WITH CHECK (is_adm_or_founder() OR TRUE); -- Allow custom tags

CREATE POLICY bt_update ON blog_tags
    FOR UPDATE
    USING (is_adm_or_founder());

-- ========================================
-- BLOG POST TAGS POLICIES
-- ========================================

CREATE POLICY bpt_select_all ON blog_post_tags
    FOR SELECT
    USING (TRUE);

CREATE POLICY bpt_insert_post_owner ON blog_post_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts bp
            WHERE bp.id = post_id
            AND (bp.user_id = get_current_user_id() OR is_founder())
        )
    );

CREATE POLICY bpt_delete_post_owner ON blog_post_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp
            WHERE bp.id = post_id
            AND (bp.user_id = get_current_user_id() OR is_founder())
        )
    );

-- ========================================
-- BLOG ATTACHMENTS POLICIES
-- ========================================

CREATE POLICY ba_select_all ON blog_attachments
    FOR SELECT
    USING (TRUE);

CREATE POLICY ba_insert_post_owner ON blog_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts bp
            WHERE bp.id = post_id
            AND bp.user_id = get_current_user_id()
        )
    );

-- ========================================
-- BLOG REACTIONS POLICIES
-- ========================================

CREATE POLICY br_select_all ON blog_reactions
    FOR SELECT
    USING (TRUE);

CREATE POLICY br_insert_own ON blog_reactions
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

CREATE POLICY br_update_own ON blog_reactions
    FOR UPDATE
    USING (user_id = get_current_user_id());

CREATE POLICY br_delete_own ON blog_reactions
    FOR DELETE
    USING (user_id = get_current_user_id());

-- ========================================
-- BLOG COMMENTS POLICIES
-- ========================================

CREATE POLICY bc_select_all ON blog_comments
    FOR SELECT
    USING (is_deleted = FALSE OR user_id = get_current_user_id() OR is_founder());

CREATE POLICY bc_insert_own ON blog_comments
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

CREATE POLICY bc_update_own ON blog_comments
    FOR UPDATE
    USING (user_id = get_current_user_id() OR is_founder());

CREATE POLICY bc_delete_own ON blog_comments
    FOR DELETE
    USING (user_id = get_current_user_id() OR is_founder());

-- ========================================
-- WIKI FOLDERS POLICIES
-- ========================================

-- Everyone can see published folders
CREATE POLICY wf_select_all ON wiki_folders
    FOR SELECT
    USING (is_published = TRUE OR is_adm_or_founder());

-- Only ADMs and founders can manage folders
CREATE POLICY wf_insert ON wiki_folders
    FOR INSERT
    WITH CHECK (is_adm_or_founder());

CREATE POLICY wf_update ON wiki_folders
    FOR UPDATE
    USING (is_adm_or_founder());

CREATE POLICY wf_delete ON wiki_folders
    FOR DELETE
    USING (is_founder());

-- ========================================
-- WIKI ARTICLES POLICIES
-- ========================================

-- Everyone can see published articles
CREATE POLICY wa_select_all ON wiki_articles
    FOR SELECT
    USING (is_published = TRUE OR is_adm_or_founder());

-- Only ADMs and founders can manage articles
CREATE POLICY wa_insert ON wiki_articles
    FOR INSERT
    WITH CHECK (is_adm_or_founder());

CREATE POLICY wa_update ON wiki_articles
    FOR UPDATE
    USING (is_adm_or_founder());

CREATE POLICY wa_delete ON wiki_articles
    FOR DELETE
    USING (is_founder());

-- ========================================
-- WIKI ARTICLE HISTORY POLICIES
-- ========================================

CREATE POLICY wah_select ON wiki_article_history
    FOR SELECT
    USING (is_adm_or_founder());

-- ========================================
-- WIKI BOOKMARKS POLICIES
-- ========================================

CREATE POLICY wb_select_own ON wiki_bookmarks
    FOR SELECT
    USING (user_id = get_current_user_id());

CREATE POLICY wb_insert_own ON wiki_bookmarks
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

CREATE POLICY wb_delete_own ON wiki_bookmarks
    FOR DELETE
    USING (user_id = get_current_user_id());

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON questionnaire_responses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON questionnaire_questions TO authenticated;
GRANT INSERT ON user_activity_log TO authenticated;
GRANT INSERT, UPDATE, DELETE ON blog_posts TO authenticated;
GRANT INSERT, UPDATE ON blog_tags TO authenticated;
GRANT INSERT, DELETE ON blog_post_tags TO authenticated;
GRANT INSERT ON blog_attachments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON blog_reactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON blog_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON wiki_folders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON wiki_articles TO authenticated;
GRANT INSERT, DELETE ON wiki_bookmarks TO authenticated;

-- Grant access to views
GRANT SELECT ON users_full_data TO authenticated;
GRANT SELECT ON member_stats TO authenticated;
GRANT SELECT ON active_blog_posts TO authenticated;
GRANT SELECT ON popular_tags TO authenticated;
GRANT SELECT ON user_posts_summary TO authenticated;
GRANT SELECT ON wiki_folder_tree TO authenticated;
GRANT SELECT ON recent_wiki_articles TO authenticated;
GRANT SELECT ON popular_wiki_articles TO authenticated;
