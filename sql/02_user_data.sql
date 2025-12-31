-- =============================================
-- WARD ACADEMY - DADOS DO QUESTIONARIO
-- Tabelas para armazenar respostas do questionario inicial
-- =============================================

-- Step 1: Dados basicos
CREATE TABLE IF NOT EXISTS user_basic_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    medical_school VARCHAR(255),
    graduation_year INTEGER,
    graduation_semester VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 2: Dados USMLE
CREATE TABLE IF NOT EXISTS user_usmle_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    -- Step 1
    step1_status VARCHAR(50) CHECK (step1_status IN ('not_started', 'studying', 'scheduled', 'passed', 'failed')),
    step1_score INTEGER,
    step1_date DATE,
    step1_attempts INTEGER DEFAULT 0,
    -- Step 2 CK
    step2ck_status VARCHAR(50) CHECK (step2ck_status IN ('not_started', 'studying', 'scheduled', 'passed', 'failed')),
    step2ck_score INTEGER,
    step2ck_date DATE,
    step2ck_attempts INTEGER DEFAULT 0,
    -- Step 3
    step3_status VARCHAR(50) CHECK (step3_status IN ('not_started', 'studying', 'scheduled', 'passed', 'failed')),
    step3_score INTEGER,
    step3_date DATE,
    step3_attempts INTEGER DEFAULT 0,
    -- OET
    oet_status VARCHAR(50) CHECK (oet_status IN ('not_started', 'studying', 'scheduled', 'passed', 'failed')),
    oet_score VARCHAR(50),
    oet_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 3: Dados UWorld gerais
CREATE TABLE IF NOT EXISTS user_uworld_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    has_uworld BOOLEAN DEFAULT FALSE,
    uworld_step VARCHAR(20) CHECK (uworld_step IN ('step1', 'step2ck', 'step3')),
    subscription_start DATE,
    subscription_end DATE,
    questions_done INTEGER DEFAULT 0,
    questions_total INTEGER DEFAULT 0,
    overall_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 4: Progresso UWorld por System/Category
CREATE TABLE IF NOT EXISTS user_uworld_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    step VARCHAR(20) CHECK (step IN ('step1', 'step2ck', 'step3')),
    system_name VARCHAR(100) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    questions_done INTEGER DEFAULT 0,
    questions_total INTEGER DEFAULT 0,
    percentage_correct DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Nivel de ingles
CREATE TABLE IF NOT EXISTS user_english_level (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    self_assessment VARCHAR(50) CHECK (self_assessment IN ('beginner', 'intermediate', 'advanced', 'fluent', 'native')),
    toefl_score INTEGER,
    ielts_score DECIMAL(3,1),
    other_certification VARCHAR(255),
    other_score VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 6: Dados Anki
CREATE TABLE IF NOT EXISTS user_anki_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    uses_anki BOOLEAN DEFAULT FALSE,
    decks_used TEXT[], -- Array de nomes dos decks
    cards_mature INTEGER DEFAULT 0,
    cards_learning INTEGER DEFAULT 0,
    cards_new INTEGER DEFAULT 0,
    average_daily_reviews INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Steps 7-9: Dados de pesquisa
CREATE TABLE IF NOT EXISTS user_research_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    has_research_experience BOOLEAN DEFAULT FALSE,
    research_interest_level VARCHAR(50) CHECK (research_interest_level IN ('none', 'low', 'medium', 'high')),
    publications_count INTEGER DEFAULT 0,
    abstracts_count INTEGER DEFAULT 0,
    posters_count INTEGER DEFAULT 0,
    presentations_count INTEGER DEFAULT 0,
    ongoing_projects_count INTEGER DEFAULT 0,
    wants_mentorship BOOLEAN DEFAULT FALSE,
    research_areas TEXT[], -- Array de areas de interesse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Contatos de pesquisa (para quem tem projetos)
CREATE TABLE IF NOT EXISTS user_research_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255),
    contact_institution VARCHAR(255),
    contact_email VARCHAR(255),
    contact_role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Observerships
CREATE TABLE IF NOT EXISTS user_observerships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    has_observership BOOLEAN DEFAULT FALSE,
    observership_institution VARCHAR(255),
    observership_specialty VARCHAR(100),
    observership_duration VARCHAR(50),
    observership_date DATE,
    wants_observership BOOLEAN DEFAULT FALSE,
    preferred_specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 11: Background/Historia
CREATE TABLE IF NOT EXISTS user_background (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    why_usmle TEXT,
    career_goals TEXT,
    timeline_goals TEXT,
    challenges TEXT,
    additional_info TEXT,
    how_found_ward VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_user_basic_data_user ON user_basic_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usmle_data_user ON user_usmle_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uworld_data_user ON user_uworld_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uworld_progress_user ON user_uworld_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uworld_progress_system ON user_uworld_progress(user_id, system_name);
CREATE INDEX IF NOT EXISTS idx_user_anki_data_user ON user_anki_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_research_data_user ON user_research_data(user_id);

-- Triggers para updated_at
CREATE TRIGGER update_user_basic_data_updated_at
    BEFORE UPDATE ON user_basic_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usmle_data_updated_at
    BEFORE UPDATE ON user_usmle_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_uworld_data_updated_at
    BEFORE UPDATE ON user_uworld_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_uworld_progress_updated_at
    BEFORE UPDATE ON user_uworld_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_english_level_updated_at
    BEFORE UPDATE ON user_english_level
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_anki_data_updated_at
    BEFORE UPDATE ON user_anki_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_research_data_updated_at
    BEFORE UPDATE ON user_research_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_observerships_updated_at
    BEFORE UPDATE ON user_observerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_background_updated_at
    BEFORE UPDATE ON user_background
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
