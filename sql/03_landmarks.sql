-- =============================================
-- WARD ACADEMY - SISTEMA DE LANDMARKS (CALLS/MARCOS)
-- Gerenciamento de chamadas e marcos dos alunos
-- =============================================

-- Tabela principal de landmarks
CREATE TABLE IF NOT EXISTS landmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    landmark_type VARCHAR(100) NOT NULL, -- 'call_iria', 'call_guilherme', 'call_romulo', 'marco', etc.
    order_position INTEGER DEFAULT 0,
    is_urgent BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    notes JSONB DEFAULT '[]'::jsonb, -- Array de observacoes com {text, date, author}
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tipos de landmarks disponiveis
CREATE TABLE IF NOT EXISTS landmark_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mentor_role VARCHAR(50), -- Qual mentor e responsavel
    icon VARCHAR(10),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

-- Inserir tipos padrao de landmarks
INSERT INTO landmark_types (code, name, description, mentor_role, icon, color) VALUES
    ('call_iria', 'Chamada com Dra. Iria', 'Chamada de mentoria geral', 'mentor_iria', '📞', '#C45700'),
    ('call_guilherme', 'Chamada com Guilherme', 'Chamada focada em Anki', 'mentor_guilherme', '📞', '#2563eb'),
    ('call_romulo', 'Chamada com Romulo', 'Chamada focada em Pesquisa', 'mentor_romulo', '📞', '#059669'),
    ('call_marcos', 'Chamada com Marcos', 'Chamada tecnica/administrativa', 'mentor_marcos', '📞', '#7c3aed'),
    ('marco_step1', 'Marco Step 1', 'Marco relacionado ao Step 1', NULL, '🎯', '#f59e0b'),
    ('marco_step2', 'Marco Step 2 CK', 'Marco relacionado ao Step 2 CK', NULL, '🎯', '#10b981'),
    ('marco_step3', 'Marco Step 3', 'Marco relacionado ao Step 3', NULL, '🎯', '#6366f1'),
    ('marco_oet', 'Marco OET', 'Marco relacionado ao OET', NULL, '🎯', '#ec4899'),
    ('marco_research', 'Marco Pesquisa', 'Marco relacionado a pesquisa', 'mentor_romulo', '🔬', '#8b5cf6'),
    ('marco_anki', 'Marco Anki', 'Marco relacionado ao Anki', 'mentor_guilherme', '📚', '#14b8a6'),
    ('deadline', 'Prazo', 'Prazo importante', NULL, '⏰', '#ef4444'),
    ('exam_date', 'Data de Prova', 'Data agendada de exame', NULL, '📅', '#dc2626'),
    ('other', 'Outro', 'Outro tipo de marco', NULL, '📌', '#6b7280')
ON CONFLICT (code) DO NOTHING;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_landmarks_user ON landmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_landmarks_type ON landmarks(landmark_type);
CREATE INDEX IF NOT EXISTS idx_landmarks_completed ON landmarks(completed);
CREATE INDEX IF NOT EXISTS idx_landmarks_urgent ON landmarks(is_urgent);
CREATE INDEX IF NOT EXISTS idx_landmarks_order ON landmarks(user_id, order_position);
CREATE INDEX IF NOT EXISTS idx_landmarks_scheduled ON landmarks(scheduled_date);

-- Trigger para updated_at
CREATE TRIGGER update_landmarks_updated_at
    BEFORE UPDATE ON landmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
