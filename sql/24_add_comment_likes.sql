-- Dropar tabela existente se houver (para recriar com tipos corretos)
DROP TABLE IF EXISTS blog_comment_likes CASCADE;

-- Tabela de likes em comentários
CREATE TABLE blog_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON blog_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created ON blog_comment_likes(created_at);

-- RLS Policies para blog_comment_likes
ALTER TABLE blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- Todos podem ver likes
CREATE POLICY "Anyone can view comment likes"
    ON blog_comment_likes FOR SELECT
    USING (true);

-- Usuários autenticados podem criar likes
CREATE POLICY "Authenticated users can create comment likes"
    ON blog_comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios likes
CREATE POLICY "Users can delete their own comment likes"
    ON blog_comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Comentário na tabela
COMMENT ON TABLE blog_comment_likes IS 'Likes em comentários do blog';
