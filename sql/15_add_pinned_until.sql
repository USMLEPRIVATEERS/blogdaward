-- =============================================
-- WARD ACADEMY - Adiciona coluna pinned_until
-- =============================================

-- Adiciona coluna para controlar duração do pin
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS pinned_until TIMESTAMP WITH TIME ZONE;

-- Comentário explicativo
COMMENT ON COLUMN blog_posts.pinned_until IS 'Data até quando o post deve ficar fixado. NULL = permanente.';
