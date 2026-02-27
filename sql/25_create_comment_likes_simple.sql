-- Dropar tabela se existir
DROP TABLE IF EXISTS blog_comment_likes CASCADE;

-- Criar tabela de likes em comentários (sem RLS, como as outras tabelas de blog)
CREATE TABLE blog_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT blog_comment_likes_comment_fkey FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
    CONSTRAINT blog_comment_likes_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT blog_comment_likes_unique UNIQUE (comment_id, user_id)
);

-- Criar índices para performance
CREATE INDEX idx_comment_likes_comment ON blog_comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON blog_comment_likes(user_id);
CREATE INDEX idx_comment_likes_created ON blog_comment_likes(created_at);

-- Comentário
COMMENT ON TABLE blog_comment_likes IS 'Likes em comentários do blog';
