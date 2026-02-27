-- =============================================
-- WARD ACADEMY - CONFIGURAÇÕES DE MENTORES
-- Execute: 19_mentor_settings.sql
-- =============================================

-- Tabela de configurações de mentores
CREATE TABLE IF NOT EXISTS mentor_settings (
    id SERIAL PRIMARY KEY,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    min_days_ahead INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_mentor_settings_mentor_id ON mentor_settings(mentor_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_mentor_settings_updated_at
    BEFORE UPDATE ON mentor_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão para mentores existentes
INSERT INTO mentor_settings (mentor_id, min_days_ahead)
SELECT id, 2 FROM users WHERE role LIKE 'mentor_%'
ON CONFLICT (mentor_id) DO NOTHING;
