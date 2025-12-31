-- =============================================
-- WARD ACADEMY - DIARIOS DE ESTUDO E UWORLD
-- Registro de progresso diario dos alunos
-- =============================================

-- Diario de estudos (texto livre, 250 caracteres)
CREATE TABLE IF NOT EXISTS study_diary (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    entry_text VARCHAR(250), -- Limite de 250 caracteres
    study_hours DECIMAL(4,2), -- Horas de estudo (opcional)
    mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')), -- Humor (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Diario do UWorld (sessoes de questoes)
CREATE TABLE IF NOT EXISTS uworld_diary (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session_number INTEGER DEFAULT 1, -- Numero da sessao no dia
    questions_done INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    percentage_correct DECIMAL(5,2),
    time_spent_minutes INTEGER, -- Tempo gasto em minutos
    mode VARCHAR(50) CHECK (mode IN ('tutor', 'timed', 'untimed')),
    system_name VARCHAR(100), -- Sistema estudado
    category_name VARCHAR(100), -- Categoria estudada
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance por sistema (agregado)
CREATE TABLE IF NOT EXISTS uworld_system_performance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    step VARCHAR(20) CHECK (step IN ('step1', 'step2ck', 'step3')),
    system_name VARCHAR(100) NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_questions INTEGER DEFAULT 0,
    percentage_correct DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, step, system_name)
);

-- Funcao para atualizar performance por sistema automaticamente
CREATE OR REPLACE FUNCTION update_system_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza ou insere o registro de performance do sistema
    INSERT INTO uworld_system_performance (user_id, step, system_name, total_questions, correct_questions, percentage_correct, last_updated)
    SELECT
        NEW.user_id,
        'step1', -- Assumindo step1, pode ser ajustado
        NEW.system_name,
        SUM(questions_done),
        SUM(questions_correct),
        CASE WHEN SUM(questions_done) > 0
             THEN ROUND((SUM(questions_correct)::DECIMAL / SUM(questions_done)) * 100, 2)
             ELSE 0
        END,
        NOW()
    FROM uworld_diary
    WHERE user_id = NEW.user_id AND system_name = NEW.system_name
    GROUP BY user_id
    ON CONFLICT (user_id, step, system_name)
    DO UPDATE SET
        total_questions = EXCLUDED.total_questions,
        correct_questions = EXCLUDED.correct_questions,
        percentage_correct = EXCLUDED.percentage_correct,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- So cria o trigger se o sistema nao for nulo
CREATE OR REPLACE FUNCTION trigger_update_system_performance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.system_name IS NOT NULL THEN
        PERFORM update_system_performance();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Estatisticas diarias agregadas (para dashboard)
CREATE TABLE IF NOT EXISTS study_stats_daily (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_study_hours DECIMAL(4,2) DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    average_percentage DECIMAL(5,2),
    sessions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_study_diary_user ON study_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_study_diary_date ON study_diary(date DESC);
CREATE INDEX IF NOT EXISTS idx_study_diary_user_date ON study_diary(user_id, date);

CREATE INDEX IF NOT EXISTS idx_uworld_diary_user ON uworld_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_uworld_diary_date ON uworld_diary(date DESC);
CREATE INDEX IF NOT EXISTS idx_uworld_diary_user_date ON uworld_diary(user_id, date);
CREATE INDEX IF NOT EXISTS idx_uworld_diary_system ON uworld_diary(system_name);

CREATE INDEX IF NOT EXISTS idx_uworld_system_perf_user ON uworld_system_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_uworld_system_perf_system ON uworld_system_performance(system_name);

CREATE INDEX IF NOT EXISTS idx_study_stats_daily_user ON study_stats_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_study_stats_daily_date ON study_stats_daily(date DESC);

-- Triggers para updated_at
CREATE TRIGGER update_study_diary_updated_at
    BEFORE UPDATE ON study_diary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uworld_diary_updated_at
    BEFORE UPDATE ON uworld_diary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_stats_daily_updated_at
    BEFORE UPDATE ON study_stats_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
