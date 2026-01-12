-- ========================================
-- USMLE PRIVATEERS - Blog Schema
-- Posts with 6-month expiration and tags
-- ========================================

-- ========================================
-- BLOG TAGS TABLE
-- Predefined + user-generated tags
-- ========================================
CREATE TABLE blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_predefined BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined tags
INSERT INTO blog_tags (name, slug, is_predefined, is_active) VALUES
('Relato de Pass', 'relato-pass', TRUE, TRUE),
('Match', 'match', TRUE, TRUE),
('Observer', 'observer', TRUE, TRUE),
('Clerk', 'clerk', TRUE, TRUE),
('Anki', 'anki', TRUE, TRUE),
('UWorld', 'uworld', TRUE, TRUE),
('BnB', 'bnb', TRUE, TRUE),
('Step 1', 'step1', TRUE, TRUE),
('Step 2 CK', 'step2ck', TRUE, TRUE),
('Step 3', 'step3', TRUE, TRUE),
('ECFMG', 'ecfmg', TRUE, TRUE),
('Visto', 'visto', TRUE, TRUE),
('Pesquisa', 'pesquisa', TRUE, TRUE),
('Inglês', 'ingles', TRUE, TRUE),
('Dúvida', 'duvida', TRUE, TRUE),
('Dica', 'dica', TRUE, TRUE),
('Outro', 'outro', TRUE, TRUE);

CREATE INDEX idx_tags_usage ON blog_tags(usage_count DESC);
CREATE INDEX idx_tags_predefined ON blog_tags(is_predefined);

-- ========================================
-- BLOG POSTS TABLE
-- Max 2000 characters, 6-month expiration
-- ========================================
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Content (max 2000 characters)
    content VARCHAR(2000) NOT NULL,

    -- Engagement metrics
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,

    -- Post metadata
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Expiration (6 months from creation)
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 months'),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON blog_posts(user_id);
CREATE INDEX idx_posts_created ON blog_posts(created_at DESC);
CREATE INDEX idx_posts_expires ON blog_posts(expires_at);
CREATE INDEX idx_posts_pinned ON blog_posts(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_posts_not_deleted ON blog_posts(is_deleted) WHERE is_deleted = FALSE;

-- ========================================
-- POST TAGS JUNCTION TABLE
-- ========================================
CREATE TABLE blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_tag ON blog_post_tags(tag_id);

-- ========================================
-- POST ATTACHMENTS TABLE
-- Images and files
-- ========================================
CREATE TYPE attachment_type AS ENUM ('image', 'file');

CREATE TABLE blog_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,

    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type attachment_type NOT NULL,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attachments_post ON blog_attachments(post_id);

-- ========================================
-- POST REACTIONS TABLE
-- Like/Dislike with unique constraint
-- ========================================
CREATE TYPE reaction_type AS ENUM ('like', 'dislike');

CREATE TABLE blog_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction reaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Each user can only have one reaction per post
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_reactions_post ON blog_reactions(post_id);
CREATE INDEX idx_reactions_user ON blog_reactions(user_id);

-- ========================================
-- POST COMMENTS TABLE
-- ========================================
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,

    content VARCHAR(1000) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON blog_comments(post_id);
CREATE INDEX idx_comments_user ON blog_comments(user_id);
CREATE INDEX idx_comments_parent ON blog_comments(parent_comment_id);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update likes/dislikes count on reaction insert/delete
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction = 'like' THEN
            UPDATE blog_posts SET likes = likes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE blog_posts SET dislikes = dislikes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction = 'like' THEN
            UPDATE blog_posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
        ELSE
            UPDATE blog_posts SET dislikes = GREATEST(0, dislikes - 1) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle reaction change
        IF OLD.reaction = 'like' THEN
            UPDATE blog_posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
        ELSE
            UPDATE blog_posts SET dislikes = GREATEST(0, dislikes - 1) WHERE id = OLD.post_id;
        END IF;
        IF NEW.reaction = 'like' THEN
            UPDATE blog_posts SET likes = likes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE blog_posts SET dislikes = dislikes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reaction_counts
    AFTER INSERT OR DELETE OR UPDATE ON blog_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_reaction_counts();

-- Update comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_count();

-- Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON blog_post_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- Auto-activate tags with 3+ uses
CREATE OR REPLACE FUNCTION check_tag_activation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usage_count >= 3 AND NEW.is_predefined = FALSE THEN
        NEW.is_active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_tag_activation
    BEFORE UPDATE ON blog_tags
    FOR EACH ROW
    EXECUTE FUNCTION check_tag_activation();

-- ========================================
-- SCHEDULED CLEANUP FUNCTION
-- Delete posts older than 6 months
-- Should be called via cron job or Supabase Edge Function
-- ========================================
CREATE OR REPLACE FUNCTION cleanup_expired_posts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired posts
    WITH deleted AS (
        DELETE FROM blog_posts
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS
-- ========================================

-- Active posts view (not deleted, not expired)
CREATE VIEW active_blog_posts AS
SELECT
    p.*,
    u.full_name as author_name,
    u.avatar_url as author_avatar,
    u.role as author_role,
    ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
FROM blog_posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
LEFT JOIN blog_tags t ON pt.tag_id = t.id
WHERE p.is_deleted = FALSE
  AND p.expires_at > NOW()
GROUP BY p.id, u.full_name, u.avatar_url, u.role
ORDER BY p.is_pinned DESC, p.created_at DESC;

-- Popular tags view
CREATE VIEW popular_tags AS
SELECT
    t.*,
    (t.is_predefined OR t.usage_count >= 3) as is_visible
FROM blog_tags t
WHERE t.is_active = TRUE
ORDER BY t.is_predefined DESC, t.usage_count DESC;

-- User posts summary
CREATE VIEW user_posts_summary AS
SELECT
    u.id as user_id,
    u.full_name,
    COUNT(p.id) as total_posts,
    COALESCE(SUM(p.likes), 0) as total_likes,
    COALESCE(SUM(p.comments_count), 0) as total_comments
FROM users u
LEFT JOIN blog_posts p ON u.id = p.user_id AND p.is_deleted = FALSE
GROUP BY u.id, u.full_name;
