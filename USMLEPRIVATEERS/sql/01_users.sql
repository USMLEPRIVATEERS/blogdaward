-- ========================================
-- USMLE PRIVATEERS - Users Schema
-- We're all in the same boat!
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM (
    'membro',           -- Regular member
    'adm',              -- Administrator (can add wiki content, can't see member data)
    'fundador'          -- Founder (Marcos, Iria - full access to all data)
);

-- User Status Enum
CREATE TYPE user_status AS ENUM (
    'pending',          -- Just registered, hasn't completed onboarding
    'active',           -- Active member
    'inactive',         -- Inactive/suspended
    'blocked'           -- Blocked from platform
);

-- Education Status Enum
CREATE TYPE education_status AS ENUM (
    'estudante',        -- Currently in medical school
    'formado'           -- Already graduated (MD)
);

-- ========================================
-- MAIN USERS TABLE
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info (from registration)
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Role & Status
    role user_role DEFAULT 'membro',
    status user_status DEFAULT 'pending',

    -- Onboarding
    education_status education_status,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    questionnaire_completed BOOLEAN DEFAULT FALSE,
    whatsapp_access_granted BOOLEAN DEFAULT FALSE,

    -- Profile
    avatar_url TEXT,
    bio TEXT,
    instagram VARCHAR(100),
    linkedin VARCHAR(255),

    -- Additional Data (from questionnaire)
    country VARCHAR(100),
    institution VARCHAR(255),
    graduation_year INTEGER,
    specialty VARCHAR(255),

    -- USMLE Status
    current_step VARCHAR(20), -- 'step1', 'step2ck', 'step3', 'match'
    step1_passed BOOLEAN DEFAULT FALSE,
    step1_score INTEGER,
    step1_date DATE,
    step2ck_passed BOOLEAN DEFAULT FALSE,
    step2ck_score INTEGER,
    step2ck_date DATE,
    step3_passed BOOLEAN DEFAULT FALSE,
    step3_score INTEGER,
    step3_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,

    -- Questionnaire tracking
    questionnaire_step INTEGER DEFAULT 0,
    questionnaire_data JSONB DEFAULT '{}'::jsonb
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ========================================
-- QUESTIONNAIRE RESPONSES TABLE
-- Stores all questionnaire responses with hierarchy info
-- ========================================
CREATE TABLE questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL,
    response JSONB NOT NULL, -- Can store text, number, array, object
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questionnaire_responses_user ON questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_responses_question ON questionnaire_responses(question_id);

-- ========================================
-- QUESTIONNAIRE QUESTIONS TABLE
-- Managed by founders through admin modal
-- ========================================
CREATE TYPE question_type AS ENUM (
    'text',             -- Free text input
    'textarea',         -- Long text
    'number',           -- Numeric input
    'date',             -- Date picker
    'select',           -- Single select dropdown
    'multiselect',      -- Multiple select
    'radio',            -- Radio buttons
    'checkbox',         -- Checkboxes
    'scale',            -- 1-10 scale
    'boolean'           -- Yes/No
);

CREATE TABLE questionnaire_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Question content
    question_text TEXT NOT NULL,
    description TEXT, -- Helper text
    question_type question_type NOT NULL,

    -- Options (for select, multiselect, radio, checkbox)
    options JSONB, -- Array of {value, label} objects

    -- Validation
    is_required BOOLEAN DEFAULT FALSE,
    min_length INTEGER,
    max_length INTEGER,
    min_value NUMERIC,
    max_value NUMERIC,
    regex_pattern TEXT,

    -- Hierarchy & Ordering
    hierarchy_level INTEGER DEFAULT 1, -- 1 = most important, higher = less important
    order_position INTEGER DEFAULT 0,
    category VARCHAR(100), -- 'basic', 'usmle', 'goals', 'resources', 'community'

    -- Display conditions (show only if certain conditions met)
    show_condition JSONB, -- e.g., {"question_id": "xxx", "value": "formado"}

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_hierarchy ON questionnaire_questions(hierarchy_level, order_position);
CREATE INDEX idx_questions_category ON questionnaire_questions(category);
CREATE INDEX idx_questions_active ON questionnaire_questions(is_active);

-- ========================================
-- USER ACTIVITY LOG
-- Track all user actions for analytics
-- ========================================
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    action_type VARCHAR(50) NOT NULL, -- 'login', 'post_created', 'wiki_viewed', etc.
    action_details JSONB,
    page_url TEXT,

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON user_activity_log(user_id);
CREATE INDEX idx_activity_type ON user_activity_log(action_type);
CREATE INDEX idx_activity_created ON user_activity_log(created_at DESC);

-- Partition by month for better performance (optional)
-- CREATE INDEX idx_activity_month ON user_activity_log(DATE_TRUNC('month', created_at));

-- ========================================
-- FOUNDER ACCOUNTS SEED DATA
-- ========================================
INSERT INTO users (
    full_name,
    email,
    whatsapp,
    password_hash,
    role,
    status,
    education_status,
    onboarding_completed,
    questionnaire_completed,
    whatsapp_access_granted,
    bio
) VALUES
(
    'Marcos Vilela',
    'mentor_marcos@gmail.com',
    '+5511999999999',
    -- Password: 'privateers2024' (you should hash this properly)
    'cHJpdmF0ZWVyczIwMjRfcHJpdmF0ZWVyc19zYWx0XzIwMjQ=',
    'fundador',
    'active',
    'estudante',
    TRUE,
    TRUE,
    TRUE,
    'Co-Founder and ADM | MS4, Innovation'
),
(
    'Iria Abreu',
    'costamdiria@gmail.com',
    '+5511988888888',
    -- Password: 'privateers2024' (you should hash this properly)
    'cHJpdmF0ZWVyczIwMjRfcHJpdmF0ZWVyc19zYWx0XzIwMjQ=',
    'fundador',
    'active',
    'formado',
    TRUE,
    TRUE,
    TRUE,
    'Co-Founder and ADM | MD, Patron'
);

-- ========================================
-- DEFAULT QUESTIONNAIRE QUESTIONS
-- Based on the Google Form provided
-- ========================================
INSERT INTO questionnaire_questions (
    question_text,
    description,
    question_type,
    options,
    is_required,
    hierarchy_level,
    order_position,
    category
) VALUES
-- Basic Info (Hierarchy 1)
(
    'Qual é o seu Instagram?',
    'Siga o nosso: @usmleprivateers',
    'text',
    NULL,
    FALSE,
    1,
    1,
    'basic'
),
(
    'País de origem',
    NULL,
    'text',
    NULL,
    TRUE,
    1,
    2,
    'basic'
),
(
    'Como você nos conheceu?',
    NULL,
    'select',
    '[{"value": "instagram", "label": "Instagram"}, {"value": "youtube", "label": "YouTube"}, {"value": "whatsapp", "label": "WhatsApp"}, {"value": "amigo", "label": "Indicação de amigo"}, {"value": "google", "label": "Google"}, {"value": "reddit", "label": "Reddit"}, {"value": "outro", "label": "Outro"}]',
    TRUE,
    1,
    3,
    'basic'
),
(
    'Instituição de ensino',
    NULL,
    'text',
    NULL,
    TRUE,
    1,
    4,
    'basic'
),
(
    'Ano de formatura',
    NULL,
    'number',
    NULL,
    TRUE,
    1,
    5,
    'basic'
),
(
    'Especialidade médica',
    'Caso não seja especialista, diga a especialidade que você se interessa.',
    'text',
    NULL,
    TRUE,
    2,
    6,
    'basic'
),

-- Goals & Motivation (Hierarchy 2)
(
    'Por que você deseja ingressar na comunidade USMLE Privateers?',
    NULL,
    'textarea',
    NULL,
    TRUE,
    2,
    1,
    'goals'
),
(
    'Quais são seus objetivos com o USMLE?',
    NULL,
    'textarea',
    NULL,
    TRUE,
    2,
    2,
    'goals'
),
(
    'Como você espera contribuir para a comunidade?',
    NULL,
    'textarea',
    NULL,
    TRUE,
    2,
    3,
    'goals'
),

-- USMLE Status (Hierarchy 2)
(
    'Você está em qual etapa do processo de revalidação?',
    NULL,
    'select',
    '[{"value": "iniciando", "label": "Ainda não comecei"}, {"value": "step1_prep", "label": "Preparando Step 1"}, {"value": "step1_done", "label": "Step 1 aprovado"}, {"value": "step2_prep", "label": "Preparando Step 2 CK"}, {"value": "step2_done", "label": "Step 2 CK aprovado"}, {"value": "step3_prep", "label": "Preparando Step 3"}, {"value": "step3_done", "label": "Step 3 aprovado"}, {"value": "match", "label": "Aplicando para Match"}]',
    TRUE,
    2,
    4,
    'usmle'
),
(
    'Você faz parte de algum curso ou mentoria sobre USMLE? Qual?',
    NULL,
    'text',
    NULL,
    FALSE,
    3,
    5,
    'usmle'
),

-- Resources & Preferences (Hierarchy 3)
(
    'O que você gostaria de ver nos vídeos do nosso canal?',
    'Clique aqui para conferir o YouTube',
    'textarea',
    NULL,
    FALSE,
    3,
    1,
    'resources'
),
(
    'Temos dezenas de grupos dentro da comunidade USMLE Privateers. Marque os grupos que mais fazem sentido para você:',
    NULL,
    'multiselect',
    '[{"value": "step1", "label": "Step 1"}, {"value": "step2ck", "label": "Step 2 CK"}, {"value": "step3", "label": "Step 3"}, {"value": "match", "label": "Match"}, {"value": "research", "label": "Pesquisa"}, {"value": "anki", "label": "Anki"}, {"value": "uworld", "label": "UWorld"}, {"value": "observer", "label": "Observership"}, {"value": "visa", "label": "Visto"}, {"value": "english", "label": "Inglês"}]',
    TRUE,
    3,
    2,
    'resources'
),

-- Community Info (Hierarchy 4)
(
    'Sabia que temos duas lives totalmente gratuitas por mês?',
    'Basta ficar de olho no grupo de avisos/announcements no seu WhatsApp que enviaremos sempre todas as informações necessárias.',
    'boolean',
    NULL,
    TRUE,
    4,
    1,
    'community'
),
(
    'Eu confirmo que li e concordo com o Regramento da comunidade USMLE Privateers.',
    'Clique aqui para ler nossa Constituição',
    'boolean',
    NULL,
    TRUE,
    4,
    2,
    'community'
),
(
    'Antes de prosseguir, leia essa página abaixo e dê uma nota para o tanto que você acredita saber do processo de revalidação após a leitura:',
    'https://www.usmleprivateers.com/usmle-wiki/comece-aqui',
    'scale',
    NULL,
    TRUE,
    4,
    3,
    'community'
);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questionnaire_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS
-- ========================================

-- View for founders to see all user data
CREATE VIEW users_full_data AS
SELECT
    u.*,
    COUNT(DISTINCT qr.id) as questions_answered,
    (SELECT COUNT(*) FROM questionnaire_questions WHERE is_active = TRUE) as total_questions
FROM users u
LEFT JOIN questionnaire_responses qr ON u.id = qr.user_id
GROUP BY u.id;

-- View for member stats
CREATE VIEW member_stats AS
SELECT
    COUNT(*) FILTER (WHERE step1_passed = TRUE) as step1_champions,
    COUNT(*) FILTER (WHERE step2ck_passed = TRUE) as step2ck_champions,
    COUNT(*) FILTER (WHERE step3_passed = TRUE) as step3_champions,
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE status = 'active') as active_members
FROM users
WHERE role = 'membro';
