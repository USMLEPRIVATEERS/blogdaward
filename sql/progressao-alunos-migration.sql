-- =====================================================================
-- WARD ACADEMY — Progressão dos Alunos
-- Tabelas para a página "Progressão dos Alunos" (mentores Marcos e Iria):
--   1) ward_assessments          — catálogo global de avaliações (padrão + novas)
--   2) student_assessment_scores — notas de cada aluno por avaliação
--   3) student_bureaucracy       — checklist de burocracia por aluno (JSONB)
--   4) faculty_ecfmg_contacts    — contato do ECFMG por faculdade (compartilhado)
--
-- Rode este arquivo UMA vez no SQL editor do Supabase.
-- Idempotente: pode rodar de novo sem duplicar dados.
-- Observação: RLS fica DESABILITADA (mesmo padrão das demais tabelas do app,
-- que usam a chave anon; o acesso é controlado na aplicação).
-- =====================================================================

-- 1) Catálogo de avaliações -------------------------------------------
CREATE TABLE IF NOT EXISTS ward_assessments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    total_questions INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Avaliações padrão da Ward
INSERT INTO ward_assessments (name, total_questions, is_default, display_order) VALUES
    ('Bloco 1 — Aquecimento (UWorld)', 40, TRUE, 1),
    ('Bloco 2 — Confiança (UWorld)', 40, TRUE, 2),
    ('Bloco 3 — Simulado realista (40)', 40, TRUE, 3),
    ('Bloco 4 — Simulado realista completo (120)', 120, TRUE, 4),
    ('Blocão da Ward', NULL, TRUE, 5),
    ('WASA 1', 100, TRUE, 6),
    ('WASA 2', 120, TRUE, 7)
ON CONFLICT (name) DO NOTHING;

-- 2) Notas dos alunos por avaliação -----------------------------------
CREATE TABLE IF NOT EXISTS student_assessment_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id BIGINT NOT NULL REFERENCES ward_assessments(id) ON DELETE CASCADE,
    taken_on DATE,
    correct_count INTEGER,
    total_questions INTEGER,
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sas_user ON student_assessment_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_sas_assessment ON student_assessment_scores(assessment_id);

-- 3) Burocracia por aluno (checklist flexível em JSONB) ----------------
-- data guarda algo como:
--   { "step1": { "notarycam": true, ... , "notes": "..." },
--     "step2ck": { ... }, "step3": { ... } }
CREATE TABLE IF NOT EXISTS student_bureaucracy (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    faculty_name VARCHAR(255),
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) Contatos do ECFMG por faculdade (compartilhado entre alunos) ------
CREATE TABLE IF NOT EXISTS faculty_ecfmg_contacts (
    id BIGSERIAL PRIMARY KEY,
    faculty_name VARCHAR(255) NOT NULL UNIQUE,
    contact_name VARCHAR(255),
    contact_info TEXT,                -- telefone e/ou e-mail
    found_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificação
SELECT 'ward_assessments' AS tabela, COUNT(*) AS linhas FROM ward_assessments
UNION ALL SELECT 'student_assessment_scores', COUNT(*) FROM student_assessment_scores
UNION ALL SELECT 'student_bureaucracy', COUNT(*) FROM student_bureaucracy
UNION ALL SELECT 'faculty_ecfmg_contacts', COUNT(*) FROM faculty_ecfmg_contacts;
