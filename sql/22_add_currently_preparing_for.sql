-- =============================================
-- WARD ACADEMY - Adiciona coluna currently_preparing_for
-- Para salvar qual preparação o aluno está focando atualmente
-- =============================================

-- Adiciona coluna currently_preparing_for na tabela user_preparation_status
ALTER TABLE user_preparation_status
ADD COLUMN IF NOT EXISTS currently_preparing_for VARCHAR(20)
CHECK (currently_preparing_for IN ('step1', 'step2ck', 'step3', 'oet', 'other'));

-- Adiciona índice para facilitar consultas
CREATE INDEX IF NOT EXISTS idx_user_prep_status_current ON user_preparation_status(currently_preparing_for);

-- Comentário explicativo
COMMENT ON COLUMN user_preparation_status.currently_preparing_for IS 'Preparação atual do aluno: step1, step2ck, step3, oet, other';
