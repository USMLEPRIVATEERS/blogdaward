-- =============================================
-- WARD ACADEMY - Corrige schema da tabela landmarks
-- Adiciona coluna group_name que estava faltando
-- =============================================

-- Adiciona coluna group_name se nao existir
ALTER TABLE landmarks ADD COLUMN IF NOT EXISTS group_name VARCHAR(50);

-- Adiciona indice para group_name
CREATE INDEX IF NOT EXISTS idx_landmarks_group ON landmarks(group_name);

-- Comentario explicativo
COMMENT ON COLUMN landmarks.group_name IS 'Grupo do landmark: setup, first-round, second-round, system-calls, research, second-pass, dedicated, extras';

-- Atualiza landmarks existentes baseado no landmark_type
UPDATE landmarks SET group_name = 'setup' WHERE landmark_type = 'entry' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'first-round' WHERE landmark_type LIKE 'call_%_1' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'second-round' WHERE landmark_type LIKE 'call_%_2' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'second-round' WHERE landmark_type LIKE 'call_%_3' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'second-round' WHERE landmark_type LIKE 'call_%_4' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'research' WHERE landmark_type LIKE 'call_marcos_research%' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'second-pass' WHERE landmark_type IN ('call_iria_second_pass', 'call_iria_nbmes') AND group_name IS NULL;
UPDATE landmarks SET group_name = 'dedicated' WHERE landmark_type LIKE 'call_iria_dedicated%' OR landmark_type LIKE 'call_iria_%exam%' OR landmark_type = 'call_iria_schedule' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'system-calls' WHERE landmark_type LIKE 'call_system_%' AND group_name IS NULL;
UPDATE landmarks SET group_name = 'extras' WHERE landmark_type LIKE 'call_extra_%' AND group_name IS NULL;
