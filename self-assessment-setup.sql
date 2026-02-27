-- ============================================
-- WARD ACADEMY SELF ASSESSMENTS SETUP
-- Parceria com USMLE Privateers
-- ============================================

-- Tabela de Self Assessments disponíveis
CREATE TABLE IF NOT EXISTS self_assessments (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,               -- ex: 'WASA-1', 'WASA-2'
    name TEXT NOT NULL,                       -- ex: 'WASA 1 - Ward Academy Self Assessment 1'
    description TEXT,
    total_questions INTEGER NOT NULL DEFAULT 0,
    questions_per_block INTEGER NOT NULL DEFAULT 50,
    time_per_block_minutes INTEGER NOT NULL DEFAULT 75,
    break_time_minutes INTEGER NOT NULL DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    release_results_after_hours INTEGER DEFAULT 24,  -- Liberar resultado após X horas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questões dos Self Assessments
CREATE TABLE IF NOT EXISTS self_assessment_questions (
    id BIGSERIAL PRIMARY KEY,
    self_assessment_id BIGINT NOT NULL REFERENCES self_assessments(id),
    question_number INTEGER NOT NULL,         -- Ordem da questão no SA
    question_tags TEXT NOT NULL,              -- "Subject::System::Category"
    question TEXT NOT NULL,
    choices JSONB NOT NULL,                   -- ["A. Choice 1", "B. Choice 2", ...]
    correct_answer TEXT NOT NULL,             -- "A" | "B" | "C" | "D" | "E"
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(self_assessment_id, question_number)
);

-- Inscrições dos usuários nos Self Assessments
CREATE TABLE IF NOT EXISTS self_assessment_enrollments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    self_assessment_id BIGINT NOT NULL REFERENCES self_assessments(id),
    -- Dados de inscrição
    study_stage TEXT NOT NULL,                -- 'iniciando', 'step1', 'step2ck', 'step3'
    graduation_date DATE,                     -- Data de conclusão do curso de medicina
    current_institution TEXT,
    current_address TEXT,
    -- Status
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'enrolled',           -- 'enrolled', 'in_progress', 'completed'
    UNIQUE(user_id, self_assessment_id)
);

-- Tentativas/Blocos do Self Assessment
CREATE TABLE IF NOT EXISTS self_assessment_attempts (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES self_assessment_enrollments(id),
    block_number INTEGER NOT NULL,            -- Qual bloco (1, 2, 3, etc)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',        -- 'in_progress', 'completed', 'timed_out'
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    UNIQUE(enrollment_id, block_number)
);

-- Respostas dos usuários no Self Assessment
CREATE TABLE IF NOT EXISTS self_assessment_responses (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES self_assessment_enrollments(id),
    attempt_id BIGINT NOT NULL REFERENCES self_assessment_attempts(id),
    question_id BIGINT NOT NULL REFERENCES self_assessment_questions(id),
    selected_answer TEXT NOT NULL,            -- 'A', 'B', 'C', 'D', 'E'
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent_seconds INTEGER,
    UNIQUE(enrollment_id, question_id)
);

-- Estatísticas agregadas por questão (para mostrar média dos outros alunos)
CREATE TABLE IF NOT EXISTS self_assessment_question_stats (
    question_id BIGINT PRIMARY KEY REFERENCES self_assessment_questions(id),
    total_responses INTEGER DEFAULT 0,
    option_a_count INTEGER DEFAULT 0,
    option_b_count INTEGER DEFAULT 0,
    option_c_count INTEGER DEFAULT 0,
    option_d_count INTEGER DEFAULT 0,
    option_e_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    avg_time_seconds NUMERIC(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sa_questions_assessment ON self_assessment_questions(self_assessment_id);
CREATE INDEX IF NOT EXISTS idx_sa_enrollments_user ON self_assessment_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sa_enrollments_assessment ON self_assessment_enrollments(self_assessment_id);
CREATE INDEX IF NOT EXISTS idx_sa_attempts_enrollment ON self_assessment_attempts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sa_responses_enrollment ON self_assessment_responses(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sa_responses_question ON self_assessment_responses(question_id);

-- Trigger para atualizar estatísticas quando uma resposta é inserida
CREATE OR REPLACE FUNCTION update_self_assessment_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO self_assessment_question_stats (
        question_id, total_responses,
        option_a_count, option_b_count, option_c_count, option_d_count, option_e_count,
        correct_count, last_updated
    )
    VALUES (
        NEW.question_id, 1,
        CASE WHEN NEW.selected_answer = 'A' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'B' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'C' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'D' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'E' THEN 1 ELSE 0 END,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (question_id) DO UPDATE SET
        total_responses = self_assessment_question_stats.total_responses + 1,
        option_a_count = self_assessment_question_stats.option_a_count + CASE WHEN NEW.selected_answer = 'A' THEN 1 ELSE 0 END,
        option_b_count = self_assessment_question_stats.option_b_count + CASE WHEN NEW.selected_answer = 'B' THEN 1 ELSE 0 END,
        option_c_count = self_assessment_question_stats.option_c_count + CASE WHEN NEW.selected_answer = 'C' THEN 1 ELSE 0 END,
        option_d_count = self_assessment_question_stats.option_d_count + CASE WHEN NEW.selected_answer = 'D' THEN 1 ELSE 0 END,
        option_e_count = self_assessment_question_stats.option_e_count + CASE WHEN NEW.selected_answer = 'E' THEN 1 ELSE 0 END,
        correct_count = self_assessment_question_stats.correct_count + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sa_stats ON self_assessment_responses;
CREATE TRIGGER trigger_update_sa_stats
    AFTER INSERT ON self_assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_self_assessment_question_stats();

-- Inserir o primeiro Self Assessment (WASA 1)
INSERT INTO self_assessments (code, name, description, total_questions, questions_per_block, time_per_block_minutes, break_time_minutes)
VALUES (
    'WASA-1',
    'WASA 1 - Ward Academy Self Assessment 1',
    'Self Assessment gratuito em parceria com USMLE Privateers. Avalie seu conhecimento com questões de alta qualidade.',
    200,
    50,
    75,
    15
) ON CONFLICT (code) DO NOTHING;

-- Desabilitar RLS para as tabelas (usando autenticação custom via localStorage)
ALTER TABLE self_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_assessment_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_assessment_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_assessment_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_assessment_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_assessment_question_stats DISABLE ROW LEVEL SECURITY;
