-- ========================================
-- USMLE PRIVATEERS - Landing Page Stats
-- Managed by Founders (Marcos can set pass counts)
-- ========================================

-- ========================================
-- SITE SETTINGS TABLE
-- For landing page stats and configurations
-- ========================================
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default settings
INSERT INTO site_settings (setting_key, setting_value, description) VALUES
('landing_stats', '{
    "step1_champions": 65,
    "step2ck_champions": 24,
    "step3_champions": 6,
    "total_lives": 100,
    "community_support": "24/7"
}', 'Stats displayed on landing page hero section'),
('whatsapp_link', '"https://chat.whatsapp.com/IMNMOxYJ1tfAXJAb3FsDPJ"', 'WhatsApp community link'),
('social_links', '{
    "instagram": "https://www.instagram.com/usmleprivateers",
    "youtube": "https://www.youtube.com/@usmleprivateers",
    "twitter": "https://twitter.com/usmleprivateers",
    "linkedin": "https://www.linkedin.com/company/usmleprivateers"
}', 'Social media links');

CREATE INDEX idx_settings_key ON site_settings(setting_key);

-- ========================================
-- FEATURED POSTS TABLE
-- Posts selected by founders to appear on landing page
-- ========================================
CREATE TABLE featured_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    featured_by UUID REFERENCES users(id),
    featured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(post_id)
);

CREATE INDEX idx_featured_posts_active ON featured_posts(is_active, order_position);

-- ========================================
-- PASS REPORTS TABLE
-- Track individual pass reports for verification
-- ========================================
CREATE TABLE pass_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    step VARCHAR(20) NOT NULL, -- 'step1', 'step2ck', 'step3'
    score INTEGER,
    pass_date DATE,

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Evidence (optional)
    screenshot_url TEXT,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pass_reports_step ON pass_reports(step);
CREATE INDEX idx_pass_reports_verified ON pass_reports(is_verified);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Get landing stats
CREATE OR REPLACE FUNCTION get_landing_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT setting_value INTO stats
    FROM site_settings
    WHERE setting_key = 'landing_stats';

    RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Update landing stats (founders only)
CREATE OR REPLACE FUNCTION update_landing_stats(
    p_step1_champions INTEGER,
    p_step2ck_champions INTEGER,
    p_step3_champions INTEGER,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Check if user is founder
    SELECT role INTO user_role FROM users WHERE id = p_user_id;

    IF user_role != 'fundador' THEN
        RAISE EXCEPTION 'Only founders can update landing stats';
    END IF;

    UPDATE site_settings
    SET
        setting_value = jsonb_build_object(
            'step1_champions', p_step1_champions,
            'step2ck_champions', p_step2ck_champions,
            'step3_champions', p_step3_champions,
            'total_lives', (setting_value->>'total_lives')::integer,
            'community_support', setting_value->>'community_support'
        ),
        updated_by = p_user_id,
        updated_at = NOW()
    WHERE setting_key = 'landing_stats';

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feature a post (founders only)
CREATE OR REPLACE FUNCTION feature_post(
    p_post_id UUID,
    p_user_id UUID,
    p_order INTEGER DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Check if user is founder
    SELECT role INTO user_role FROM users WHERE id = p_user_id;

    IF user_role != 'fundador' THEN
        RAISE EXCEPTION 'Only founders can feature posts';
    END IF;

    -- Insert or update featured post
    INSERT INTO featured_posts (post_id, featured_by, order_position)
    VALUES (p_post_id, p_user_id, p_order)
    ON CONFLICT (post_id) DO UPDATE SET
        is_active = TRUE,
        order_position = p_order,
        featured_by = p_user_id,
        featured_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unfeature a post
CREATE OR REPLACE FUNCTION unfeature_post(
    p_post_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Check if user is founder
    SELECT role INTO user_role FROM users WHERE id = p_user_id;

    IF user_role != 'fundador' THEN
        RAISE EXCEPTION 'Only founders can unfeature posts';
    END IF;

    UPDATE featured_posts
    SET is_active = FALSE
    WHERE post_id = p_post_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VIEWS
-- ========================================

-- Featured posts view for landing page
CREATE VIEW landing_featured_posts AS
SELECT
    p.*,
    u.full_name as author_name,
    u.avatar_url as author_avatar,
    u.role as author_role,
    fp.featured_at,
    fp.order_position
FROM featured_posts fp
JOIN blog_posts p ON fp.post_id = p.id
JOIN users u ON p.user_id = u.id
WHERE fp.is_active = TRUE
  AND p.is_deleted = FALSE
  AND p.expires_at > NOW()
ORDER BY fp.order_position ASC, fp.featured_at DESC
LIMIT 10;

-- Pass reports summary
CREATE VIEW pass_reports_summary AS
SELECT
    step,
    COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_count,
    COUNT(*) as total_count
FROM pass_reports
GROUP BY step;

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_reports ENABLE ROW LEVEL SECURITY;

-- Site settings - anyone can read, only founders can write
CREATE POLICY ss_select_all ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY ss_update_founders ON site_settings FOR UPDATE USING (is_founder());

-- Featured posts - anyone can read, only founders can manage
CREATE POLICY fp_select_all ON featured_posts FOR SELECT USING (TRUE);
CREATE POLICY fp_insert_founders ON featured_posts FOR INSERT WITH CHECK (is_founder());
CREATE POLICY fp_update_founders ON featured_posts FOR UPDATE USING (is_founder());
CREATE POLICY fp_delete_founders ON featured_posts FOR DELETE USING (is_founder());

-- Pass reports - users can see their own, founders can see all
CREATE POLICY pr_select ON pass_reports FOR SELECT USING (user_id = get_current_user_id() OR is_founder());
CREATE POLICY pr_insert ON pass_reports FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY pr_update_founders ON pass_reports FOR UPDATE USING (is_founder());

-- Grant permissions
GRANT SELECT ON site_settings TO authenticated;
GRANT SELECT ON featured_posts TO authenticated;
GRANT SELECT, INSERT ON pass_reports TO authenticated;
GRANT SELECT ON landing_featured_posts TO authenticated;
GRANT SELECT ON pass_reports_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_landing_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_landing_stats TO authenticated;
GRANT EXECUTE ON FUNCTION feature_post TO authenticated;
GRANT EXECUTE ON FUNCTION unfeature_post TO authenticated;
