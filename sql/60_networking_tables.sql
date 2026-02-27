-- =============================================
-- WARD ACADEMY - NETWORKING SHARING SYSTEM
-- Tabelas para compartilhamento de contatos de networking
-- =============================================

-- =============================================
-- TABELA: Especialidades (dinâmica)
-- =============================================
CREATE TABLE IF NOT EXISTS networking_specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id)
);

-- Inserir especialidades iniciais
INSERT INTO networking_specialties (name) VALUES
    ('Internal Medicine'),
    ('Family Medicine'),
    ('Pediatrics'),
    ('Surgery'),
    ('Neurology'),
    ('Cardiology'),
    ('Psychiatry'),
    ('Emergency Medicine'),
    ('Anesthesiology'),
    ('Radiology'),
    ('Pathology'),
    ('Dermatology'),
    ('Ophthalmology'),
    ('Orthopedics'),
    ('Urology'),
    ('OB/GYN'),
    ('Oncology'),
    ('Gastroenterology'),
    ('Pulmonology'),
    ('Nephrology'),
    ('Endocrinology'),
    ('Rheumatology'),
    ('Infectious Disease'),
    ('Physical Medicine'),
    ('Plastic Surgery'),
    ('Neurosurgery'),
    ('Thoracic Surgery'),
    ('Vascular Surgery')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- TABELA: Posições/Cargos (dinâmica)
-- =============================================
CREATE TABLE IF NOT EXISTS networking_positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id)
);

-- Inserir posições iniciais
INSERT INTO networking_positions (name, sort_order) VALUES
    ('Medical Student', 1),
    ('PGY-1', 10),
    ('PGY-2', 11),
    ('PGY-3', 12),
    ('PGY-4', 13),
    ('PGY-5', 14),
    ('PGY-6', 15),
    ('PGY-7', 16),
    ('Chief Resident', 20),
    ('Fellow', 25),
    ('Research Fellow', 26),
    ('Attending', 30),
    ('Assistant Professor', 35),
    ('Associate Professor', 40),
    ('Professor', 45),
    ('Program Director', 50),
    ('Associate Program Director', 51),
    ('Department Chair', 55),
    ('Principal Investigator', 60),
    ('Clinical Instructor', 32),
    ('Hospitalist', 31)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- TABELA: Estados dos EUA
-- =============================================
CREATE TABLE IF NOT EXISTS networking_states (
    id SERIAL PRIMARY KEY,
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
);

-- Inserir todos os estados dos EUA
INSERT INTO networking_states (code, name) VALUES
    ('AL', 'Alabama'), ('AK', 'Alaska'), ('AZ', 'Arizona'), ('AR', 'Arkansas'),
    ('CA', 'California'), ('CO', 'Colorado'), ('CT', 'Connecticut'), ('DE', 'Delaware'),
    ('FL', 'Florida'), ('GA', 'Georgia'), ('HI', 'Hawaii'), ('ID', 'Idaho'),
    ('IL', 'Illinois'), ('IN', 'Indiana'), ('IA', 'Iowa'), ('KS', 'Kansas'),
    ('KY', 'Kentucky'), ('LA', 'Louisiana'), ('ME', 'Maine'), ('MD', 'Maryland'),
    ('MA', 'Massachusetts'), ('MI', 'Michigan'), ('MN', 'Minnesota'), ('MS', 'Mississippi'),
    ('MO', 'Missouri'), ('MT', 'Montana'), ('NE', 'Nebraska'), ('NV', 'Nevada'),
    ('NH', 'New Hampshire'), ('NJ', 'New Jersey'), ('NM', 'New Mexico'), ('NY', 'New York'),
    ('NC', 'North Carolina'), ('ND', 'North Dakota'), ('OH', 'Ohio'), ('OK', 'Oklahoma'),
    ('OR', 'Oregon'), ('PA', 'Pennsylvania'), ('RI', 'Rhode Island'), ('SC', 'South Carolina'),
    ('SD', 'South Dakota'), ('TN', 'Tennessee'), ('TX', 'Texas'), ('UT', 'Utah'),
    ('VT', 'Vermont'), ('VA', 'Virginia'), ('WA', 'Washington'), ('WV', 'West Virginia'),
    ('WI', 'Wisconsin'), ('WY', 'Wyoming'), ('DC', 'District of Columbia'),
    ('PR', 'Puerto Rico'), ('VI', 'Virgin Islands')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- TABELA: Cidades (dinâmica, adicionadas pelos usuários)
-- =============================================
CREATE TABLE IF NOT EXISTS networking_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) REFERENCES networking_states(code),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    UNIQUE(name, state_code)
);

-- =============================================
-- TABELA: Contatos de Networking (principal)
-- =============================================
CREATE TABLE IF NOT EXISTS networking_contacts (
    id SERIAL PRIMARY KEY,

    -- Informações básicas do contato
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Localização
    institution VARCHAR(300),
    department VARCHAR(200),
    city_id INTEGER REFERENCES networking_cities(id),
    state_code VARCHAR(2) REFERENCES networking_states(code),

    -- Profissional
    specialty_id INTEGER REFERENCES networking_specialties(id),
    position_id INTEGER REFERENCES networking_positions(id),

    -- Notas adicionais
    notes TEXT,
    linkedin_url VARCHAR(500),

    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_networking_contacts_specialty ON networking_contacts(specialty_id);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_position ON networking_contacts(position_id);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_state ON networking_contacts(state_code);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_city ON networking_contacts(city_id);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_created_by ON networking_contacts(created_by);

-- =============================================
-- TABELA: Conexões usuário-contato
-- Permite múltiplos usuários conhecerem o mesmo contato
-- =============================================
CREATE TABLE IF NOT EXISTS networking_connections (
    id SERIAL PRIMARY KEY,

    -- Quem conhece
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Quem é conhecido
    contact_id INTEGER NOT NULL REFERENCES networking_contacts(id) ON DELETE CASCADE,

    -- Tipo de conexão
    connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN (
        'personal_friend',      -- Amigo pessoal
        'email_contact',        -- Contato por email
        'phone_contact',        -- Contato por telefone
        'knows_someone',        -- Conhece alguém que conhece
        'met_at_event',         -- Conheceu em evento
        'worked_together',      -- Trabalhou junto
        'research_colleague',   -- Colega de pesquisa
        'mentor_mentee',        -- Relação mentor/mentee
        'linkedin',             -- Conexão LinkedIn
        'other'                 -- Outro
    )),

    -- Descrição adicional da conexão
    connection_description TEXT,

    -- Intermediário (se connection_type = 'knows_someone')
    intermediary_name VARCHAR(200),

    -- Força da conexão (1-5)
    connection_strength INTEGER DEFAULT 3 CHECK (connection_strength BETWEEN 1 AND 5),

    -- Metadados
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Evitar duplicatas
    UNIQUE(user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_networking_connections_user ON networking_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_networking_connections_contact ON networking_connections(contact_id);

-- =============================================
-- TABELA: Solicitações para Mentores
-- =============================================
CREATE TABLE IF NOT EXISTS networking_mentor_requests (
    id SERIAL PRIMARY KEY,

    -- Quem solicitou
    requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Sobre qual contato
    contact_id INTEGER NOT NULL REFERENCES networking_contacts(id) ON DELETE CASCADE,

    -- Quem tem a conexão (usuário que conhece o contato)
    connection_owner_id BIGINT NOT NULL REFERENCES users(id),

    -- Mensagem do solicitante
    message TEXT,

    -- Status da solicitação
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'declined')),

    -- Resposta do mentor
    mentor_response TEXT,
    responded_by BIGINT REFERENCES users(id),
    responded_at TIMESTAMP WITH TIME ZONE,

    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networking_requests_status ON networking_mentor_requests(status);
CREATE INDEX IF NOT EXISTS idx_networking_requests_requested_by ON networking_mentor_requests(requested_by);

-- =============================================
-- VIEW: Contatos com todas as informações
-- =============================================
CREATE OR REPLACE VIEW networking_contacts_full AS
SELECT
    c.*,
    s.name as specialty_name,
    p.name as position_name,
    st.name as state_name,
    ct.name as city_name,
    u.full_name as created_by_name,
    (SELECT COUNT(*) FROM networking_connections nc WHERE nc.contact_id = c.id) as connection_count
FROM networking_contacts c
LEFT JOIN networking_specialties s ON c.specialty_id = s.id
LEFT JOIN networking_positions p ON c.position_id = p.id
LEFT JOIN networking_states st ON c.state_code = st.code
LEFT JOIN networking_cities ct ON c.city_id = ct.id
LEFT JOIN users u ON c.created_by = u.id
WHERE c.is_active = TRUE;

-- =============================================
-- VIEW: Conexões com informações completas
-- =============================================
CREATE OR REPLACE VIEW networking_connections_full AS
SELECT
    nc.*,
    c.name as contact_name,
    c.institution,
    c.specialty_id,
    c.position_id,
    c.state_code,
    c.city_id,
    s.name as specialty_name,
    p.name as position_name,
    u.full_name as user_name,
    u.email as user_email
FROM networking_connections nc
JOIN networking_contacts c ON nc.contact_id = c.id
LEFT JOIN networking_specialties s ON c.specialty_id = s.id
LEFT JOIN networking_positions p ON c.position_id = p.id
JOIN users u ON nc.user_id = u.id
WHERE c.is_active = TRUE;

-- =============================================
-- FUNCTION: Adicionar nova especialidade
-- =============================================
CREATE OR REPLACE FUNCTION add_networking_specialty(
    p_name TEXT,
    p_user_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO networking_specialties (name, created_by)
    VALUES (TRIM(p_name), p_user_id)
    ON CONFLICT (name) DO UPDATE SET name = networking_specialties.name
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Adicionar nova posição
-- =============================================
CREATE OR REPLACE FUNCTION add_networking_position(
    p_name TEXT,
    p_user_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO networking_positions (name, created_by)
    VALUES (TRIM(p_name), p_user_id)
    ON CONFLICT (name) DO UPDATE SET name = networking_positions.name
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Adicionar nova cidade
-- =============================================
CREATE OR REPLACE FUNCTION add_networking_city(
    p_name TEXT,
    p_state_code TEXT,
    p_user_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO networking_cities (name, state_code, created_by)
    VALUES (TRIM(p_name), p_state_code, p_user_id)
    ON CONFLICT (name, state_code) DO UPDATE SET name = networking_cities.name
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PERMISSÕES
-- =============================================
GRANT ALL ON networking_specialties TO authenticated, anon;
GRANT ALL ON networking_positions TO authenticated, anon;
GRANT ALL ON networking_states TO authenticated, anon;
GRANT ALL ON networking_cities TO authenticated, anon;
GRANT ALL ON networking_contacts TO authenticated, anon;
GRANT ALL ON networking_connections TO authenticated, anon;
GRANT ALL ON networking_mentor_requests TO authenticated, anon;

GRANT SELECT ON networking_contacts_full TO authenticated, anon;
GRANT SELECT ON networking_connections_full TO authenticated, anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

GRANT EXECUTE ON FUNCTION add_networking_specialty TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_networking_position TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_networking_city TO authenticated, anon;

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE networking_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_mentor_requests ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (todos podem ler/escrever)
CREATE POLICY networking_specialties_all ON networking_specialties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY networking_positions_all ON networking_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY networking_states_all ON networking_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY networking_cities_all ON networking_cities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY networking_contacts_all ON networking_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY networking_connections_all ON networking_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY networking_mentor_requests_all ON networking_mentor_requests FOR ALL USING (true) WITH CHECK (true);
