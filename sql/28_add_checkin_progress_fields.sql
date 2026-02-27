-- ============================================
-- Adicionar campos de progresso ao Check-in Diário
-- ============================================

-- Adicionar campos para rastrear progresso de UWorld
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS uworld_questions_done INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uworld_correct_answers INTEGER DEFAULT 0;

-- Adicionar campos para rastrear progresso de Anki
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS anki_cards_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS anki_avg_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS anki_current_streak INTEGER DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN daily_checkins.uworld_questions_done IS 'Total de questões do UWorld feitas até hoje';
COMMENT ON COLUMN daily_checkins.uworld_correct_answers IS 'Total de acertos no UWorld até hoje';
COMMENT ON COLUMN daily_checkins.anki_cards_today IS 'Quantidade de flashcards do Anki feitos hoje';
COMMENT ON COLUMN daily_checkins.anki_avg_cards IS 'Média de cards do Anki por dia';
COMMENT ON COLUMN daily_checkins.anki_current_streak IS 'Streak atual do Anki (dias consecutivos)';
