-- =============================================
-- WARD ACADEMY - Adiciona filtro por Step aos links
-- =============================================

-- Remove a FK constraint de category para permitir valores mais flexiveis
ALTER TABLE links_repository DROP CONSTRAINT IF EXISTS links_repository_category_fkey;

-- Adiciona coluna step para filtrar por exame
ALTER TABLE links_repository ADD COLUMN IF NOT EXISTS step VARCHAR(50);

-- Comentario explicativo
COMMENT ON COLUMN links_repository.step IS 'Qual step/exame o link se aplica: step1, step2, step3, pesquisa, match, outros';

-- Atualiza alguns links existentes com o step apropriado
UPDATE links_repository SET step = 'step1' WHERE category IN ('UWorld', 'Anki', 'First Aid', 'Pathoma', 'Sketchy', 'Boards and Beyond');
UPDATE links_repository SET step = 'pesquisa' WHERE category = 'Research';

-- Indice para performance
CREATE INDEX IF NOT EXISTS idx_links_repository_step ON links_repository(step);
