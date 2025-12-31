-- =============================================
-- WARD ACADEMY - Adiciona colunas faltantes em users
-- =============================================

-- Adiciona coluna status se nao existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Adiciona coluna name (username curto) se nao existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Adiciona coluna full_name se nao existir (caso nao tenha sido criada)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Adiciona colunas de configuracao de diarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_diary_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS uworld_diary_enabled BOOLEAN DEFAULT FALSE;

-- Comentarios
COMMENT ON COLUMN users.status IS 'Status do usuario: active, inactive';
COMMENT ON COLUMN users.name IS 'Nome curto/username do usuario';
COMMENT ON COLUMN users.full_name IS 'Nome completo do usuario';
