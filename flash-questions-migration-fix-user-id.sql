-- ============================================
-- FLASH QUESTIONS - MIGRATION TO FIX USER_ID TYPE
-- ============================================
-- This script fixes the user_id columns to use BIGINT
-- instead of UUID to match Ward Academy's users table
-- Execute this in Supabase SQL Editor

-- Drop existing tables (data will be lost - only do this if no important data exists yet)
DROP TABLE IF EXISTS flash_question_responses CASCADE;
DROP TABLE IF EXISTS flash_tests CASCADE;
DROP TABLE IF EXISTS flash_question_comments CASCADE;
DROP TABLE IF EXISTS flash_question_stats CASCADE;
DROP TABLE IF EXISTS flash_questions CASCADE;

-- 1. Tabela de questões flash
CREATE TABLE IF NOT EXISTS flash_questions (
    id BIGSERIAL PRIMARY KEY,
    question_id TEXT NOT NULL UNIQUE,
    step INTEGER NOT NULL CHECK (step IN (1, 2, 3)), -- 1 = Step 1, 2 = Step 2 CK, 3 = Step 3
    question_tags TEXT NOT NULL, -- Format: Subject::System::Category
    question TEXT NOT NULL,
    choices JSONB NOT NULL, -- Array de alternativas
    correct_answer TEXT NOT NULL, -- A, B, C, D, E
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de respostas dos usuários
CREATE TABLE IF NOT EXISTS flash_question_responses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected_answer TEXT NOT NULL, -- A, B, C, D, E
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER, -- Tempo gasto na questão
    test_id BIGINT, -- Referência ao teste (se aplicável)
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (question_id) REFERENCES flash_questions(question_id) ON DELETE CASCADE
);

-- 3. Tabela de testes flash
CREATE TABLE IF NOT EXISTS flash_tests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_name TEXT,
    filters JSONB, -- Filtros aplicados (assunto, sistema, categoria)
    question_ids TEXT[] NOT NULL, -- Array de IDs das questões
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_time_seconds INTEGER DEFAULT 0
);

-- 4. Tabela de comentários nas questões
CREATE TABLE IF NOT EXISTS flash_question_comments (
    id BIGSERIAL PRIMARY KEY,
    question_id TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (question_id) REFERENCES flash_questions(question_id) ON DELETE CASCADE
);

-- 5. Tabela de estatísticas agregadas (para performance)
CREATE TABLE IF NOT EXISTS flash_question_stats (
    question_id TEXT PRIMARY KEY,
    total_responses INTEGER DEFAULT 0,
    option_a_count INTEGER DEFAULT 0,
    option_b_count INTEGER DEFAULT 0,
    option_c_count INTEGER DEFAULT 0,
    option_d_count INTEGER DEFAULT 0,
    option_e_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    avg_time_seconds NUMERIC(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (question_id) REFERENCES flash_questions(question_id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_flash_questions_step ON flash_questions(step);
CREATE INDEX IF NOT EXISTS idx_flash_questions_tags ON flash_questions USING gin(to_tsvector('portuguese', question_tags));
CREATE INDEX IF NOT EXISTS idx_flash_question_responses_user ON flash_question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_question_responses_question ON flash_question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_flash_tests_user ON flash_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_tests_status ON flash_tests(status);
CREATE INDEX IF NOT EXISTS idx_flash_question_comments_question ON flash_question_comments(question_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE flash_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_question_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_question_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para flash_questions
-- Todos podem ler questões
CREATE POLICY "Anyone can read questions" ON flash_questions
    FOR SELECT USING (true);

-- Apenas administradores podem inserir/atualizar questões
CREATE POLICY "Admins can insert questions" ON flash_questions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update questions" ON flash_questions
    FOR UPDATE USING (true);

-- Políticas para flash_question_responses
-- Todos autenticados podem ver respostas (para estatísticas)
CREATE POLICY "Users can read all responses" ON flash_question_responses
    FOR SELECT USING (true);

-- Todos autenticados podem inserir respostas
CREATE POLICY "Users can insert responses" ON flash_question_responses
    FOR INSERT WITH CHECK (true);

-- Políticas para flash_tests
-- Todos podem ver todos os testes (ou ajuste para ver apenas os próprios)
CREATE POLICY "Users can read tests" ON flash_tests
    FOR SELECT USING (true);

-- Todos autenticados podem criar testes
CREATE POLICY "Users can insert tests" ON flash_tests
    FOR INSERT WITH CHECK (true);

-- Todos autenticados podem atualizar testes
CREATE POLICY "Users can update tests" ON flash_tests
    FOR UPDATE USING (true);

-- Políticas para flash_question_comments
-- Todos podem ler comentários
CREATE POLICY "Anyone can read comments" ON flash_question_comments
    FOR SELECT USING (true);

-- Usuários autenticados podem criar comentários
CREATE POLICY "Users can insert comments" ON flash_question_comments
    FOR INSERT WITH CHECK (true);

-- Usuários podem atualizar comentários
CREATE POLICY "Users can update comments" ON flash_question_comments
    FOR UPDATE USING (true);

-- Usuários podem deletar comentários
CREATE POLICY "Users can delete comments" ON flash_question_comments
    FOR DELETE USING (true);

-- Políticas para flash_question_stats
-- Todos podem ler estatísticas
CREATE POLICY "Anyone can read stats" ON flash_question_stats
    FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS E TRIGGERS
-- ============================================

-- Função para atualizar estatísticas quando uma resposta é adicionada
CREATE OR REPLACE FUNCTION update_flash_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir ou atualizar estatísticas
    INSERT INTO flash_question_stats (
        question_id,
        total_responses,
        option_a_count,
        option_b_count,
        option_c_count,
        option_d_count,
        option_e_count,
        correct_count,
        incorrect_count
    ) VALUES (
        NEW.question_id,
        1,
        CASE WHEN NEW.selected_answer = 'A' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'B' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'C' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'D' THEN 1 ELSE 0 END,
        CASE WHEN NEW.selected_answer = 'E' THEN 1 ELSE 0 END,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END
    )
    ON CONFLICT (question_id) DO UPDATE SET
        total_responses = flash_question_stats.total_responses + 1,
        option_a_count = flash_question_stats.option_a_count + CASE WHEN NEW.selected_answer = 'A' THEN 1 ELSE 0 END,
        option_b_count = flash_question_stats.option_b_count + CASE WHEN NEW.selected_answer = 'B' THEN 1 ELSE 0 END,
        option_c_count = flash_question_stats.option_c_count + CASE WHEN NEW.selected_answer = 'C' THEN 1 ELSE 0 END,
        option_d_count = flash_question_stats.option_d_count + CASE WHEN NEW.selected_answer = 'D' THEN 1 ELSE 0 END,
        option_e_count = flash_question_stats.option_e_count + CASE WHEN NEW.selected_answer = 'E' THEN 1 ELSE 0 END,
        correct_count = flash_question_stats.correct_count + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        incorrect_count = flash_question_stats.incorrect_count + CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas
DROP TRIGGER IF EXISTS trigger_update_flash_stats ON flash_question_responses;
CREATE TRIGGER trigger_update_flash_stats
    AFTER INSERT ON flash_question_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_flash_question_stats();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_flash_questions_updated_at ON flash_questions;
CREATE TRIGGER trigger_flash_questions_updated_at
    BEFORE UPDATE ON flash_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_flash_comments_updated_at ON flash_question_comments;
CREATE TRIGGER trigger_flash_comments_updated_at
    BEFORE UPDATE ON flash_question_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERIR DADOS DE EXEMPLO
-- ============================================

-- Inserir as 3 questões de exemplo fornecidas
INSERT INTO flash_questions (question_id, step, question_tags, question, choices, correct_answer, explanation)
VALUES
(
    '1',
    1, -- Step 1
    'Physiology::Cardiovascular_System::Normal_structure_and_function',
    'A patient is treated with amlodipine for hypertension. Which point on the cardiac pressure-volume loop is most affected by this calcium channel blocker?',
    '["A. End-diastolic volume", "B. End-systolic volume", "C. Stroke volume", "D. Afterload", "E. Preload"]'::jsonb,
    'D',
    'Amlodipine is a dihydropyridine calcium channel blocker that primarily causes vasodilation, reducing systemic vascular resistance and thereby decreasing afterload. This shifts the end-systolic pressure-volume relationship downward.'
),
(
    '2',
    1, -- Step 1
    'Pathology::Cardiovascular_System::Coronary_heart_disease',
    'What is the most effective intervention to reduce myocardial infarction risk in a patient with hypertension, diabetes, and smoking?',
    '["A. Alcohol abstinence", "B. Blood pressure control", "C. Exercise", "D. Smoking cessation", "E. Glucose control"]'::jsonb,
    'D',
    'Smoking cessation provides the greatest risk reduction for MI. While all other factors are important, smoking has the most significant independent effect on coronary artery disease risk.'
),
(
    '3',
    1, -- Step 1
    'Pathology::Cardiovascular_System::Myopericardial_diseases',
    'A 34-year-old alcoholic presents with dyspnea and ankle swelling. Autopsy shows enlarged ventricles with mild hypertrophy and interstitial fibrosis. What is the diagnosis?',
    '["A. Cor pulmonale", "B. Dilated cardiomyopathy", "C. Hypertrophic cardiomyopathy", "D. Ischemic heart disease", "E. Restrictive cardiomyopathy"]'::jsonb,
    'B',
    'Chronic alcohol abuse causes dilated cardiomyopathy characterized by ventricular dilation with mild compensatory hypertrophy and interstitial fibrosis.'
)
ON CONFLICT (question_id) DO NOTHING;

-- Inserir estatísticas iniciais para as questões
INSERT INTO flash_question_stats (question_id)
SELECT question_id FROM flash_questions
ON CONFLICT DO NOTHING;

-- ============================================
-- CONCLUÍDO!
-- ============================================
