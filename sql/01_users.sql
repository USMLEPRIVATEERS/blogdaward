-- =============================================
-- WARD ACADEMY - TABELA DE USUARIOS
-- Execute este arquivo primeiro
-- =============================================

-- Tabela principal de usuarios
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'aluno' CHECK (role IN ('aluno', 'mentor_marcos', 'mentor_iria', 'mentor_guilherme', 'mentor_romulo')),
    first_login_completed BOOLEAN DEFAULT FALSE,
    questionnaire_step INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de status de preparacao atual do usuario
CREATE TABLE IF NOT EXISTS user_preparation_status (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    currently_preparing_for VARCHAR(50) CHECK (currently_preparing_for IN ('step1', 'step2ck', 'step3', 'oet', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Tabela de check-ins diarios
CREATE TABLE IF NOT EXISTS daily_checkins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('tranquilo', 'preciso_ajuda', 'parado', 'custom')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_created ON daily_checkins(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preparation_status_updated_at
    BEFORE UPDATE ON user_preparation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
