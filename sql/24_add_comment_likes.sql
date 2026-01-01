-- Tabela de likes em comentários
CREATE TABLE IF NOT EXISTS blog_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON blog_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created ON blog_comment_likes(created_at);

-- Comentário na tabela
COMMENT ON TABLE blog_comment_likes IS 'Likes em comentários do blog';
