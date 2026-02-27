-- =============================================
-- WARD ACADEMY - BLOG E COMENTARIOS
-- Sistema de posts e interacoes da comunidade
-- =============================================

-- Tabela de posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    pinned_by BIGINT REFERENCES users(id),
    pinned_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comentarios
CREATE TABLE IF NOT EXISTS blog_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id BIGINT REFERENCES blog_comments(id) ON DELETE CASCADE, -- Para respostas aninhadas
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de reacoes (para evitar multiplas reacoes do mesmo usuario)
CREATE TABLE IF NOT EXISTS blog_reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Funcao para atualizar contagem de likes/dislikes
CREATE OR REPLACE FUNCTION update_post_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'like' THEN
            UPDATE blog_posts SET likes = likes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE blog_posts SET dislikes = dislikes + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'like' THEN
            UPDATE blog_posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
        ELSE
            UPDATE blog_posts SET dislikes = GREATEST(0, dislikes - 1) WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.reaction_type != NEW.reaction_type THEN
        IF NEW.reaction_type = 'like' THEN
            UPDATE blog_posts SET likes = likes + 1, dislikes = GREATEST(0, dislikes - 1) WHERE id = NEW.post_id;
        ELSE
            UPDATE blog_posts SET likes = GREATEST(0, likes - 1), dislikes = dislikes + 1 WHERE id = NEW.post_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reaction_counts
    AFTER INSERT OR UPDATE OR DELETE ON blog_reactions
    FOR EACH ROW EXECUTE FUNCTION update_post_reaction_counts();

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_pinned ON blog_posts(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_likes ON blog_posts(likes DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_reactions_post ON blog_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_reactions_user ON blog_reactions(user_id);

-- Triggers para updated_at
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
