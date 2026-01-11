-- =============================================
-- WARD ACADEMY - ADICIONAR ANEXOS AO BLOG
-- Permite imagens e arquivos nos posts
-- =============================================

-- Adicionar colunas para imagens (array de URLs) e arquivo anexo
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Comentario sobre as colunas:
-- images: array JSON com ate 3 URLs de imagens (podem ser URLs externas ou do Google Drive)
-- attachment_url: URL do arquivo anexo no Google Drive
-- attachment_name: nome original do arquivo anexo
