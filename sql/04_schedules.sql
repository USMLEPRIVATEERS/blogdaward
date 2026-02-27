-- =============================================
-- WARD ACADEMY - CRONOGRAMAS DE ESTUDO
-- Sistema de cronograma de first pass e atrasos
-- =============================================

-- Tabela de cronogramas (First Pass)
CREATE TABLE IF NOT EXISTS schedules (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    system VARCHAR(100) NOT NULL, -- Ex: Cardiovascular, Respiratory, etc.
    category VARCHAR(100) NOT NULL, -- Ex: Anatomy, Physiology, Pathology, etc.
    questions INTEGER DEFAULT 0, -- Numero de questoes
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sinalizacao de atrasos
CREATE TABLE IF NOT EXISTS schedule_delays (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    acknowledged_by BIGINT REFERENCES users(id), -- Mentor que reconheceu
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sistemas USMLE (referencia)
CREATE TABLE IF NOT EXISTS usmle_systems (
    id BIGSERIAL PRIMARY KEY,
    step VARCHAR(20) NOT NULL CHECK (step IN ('step1', 'step2ck', 'step3')),
    system_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(step, system_name)
);

-- Tabela de categorias por sistema (referencia)
CREATE TABLE IF NOT EXISTS usmle_categories (
    id BIGSERIAL PRIMARY KEY,
    system_id BIGINT REFERENCES usmle_systems(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Inserir sistemas Step 1
INSERT INTO usmle_systems (step, system_name, display_order) VALUES
    ('step1', 'Behavioral Science & Biostatistics', 1),
    ('step1', 'Biochemistry & Nutrition', 2),
    ('step1', 'Microbiology', 3),
    ('step1', 'Immunology', 4),
    ('step1', 'Pathology', 5),
    ('step1', 'Pharmacology', 6),
    ('step1', 'Cardiovascular', 7),
    ('step1', 'Endocrine', 8),
    ('step1', 'Gastrointestinal', 9),
    ('step1', 'Hematology & Oncology', 10),
    ('step1', 'Musculoskeletal, Skin & Connective Tissue', 11),
    ('step1', 'Neurology & Special Senses', 12),
    ('step1', 'Psychiatry', 13),
    ('step1', 'Renal', 14),
    ('step1', 'Reproductive', 15),
    ('step1', 'Respiratory', 16)
ON CONFLICT (step, system_name) DO NOTHING;

-- Inserir sistemas Step 2 CK
INSERT INTO usmle_systems (step, system_name, display_order) VALUES
    ('step2ck', 'Cardiovascular', 1),
    ('step2ck', 'Dermatology', 2),
    ('step2ck', 'Endocrine', 3),
    ('step2ck', 'Gastrointestinal & Nutrition', 4),
    ('step2ck', 'Hematology & Oncology', 5),
    ('step2ck', 'Infectious Disease', 6),
    ('step2ck', 'Musculoskeletal', 7),
    ('step2ck', 'Neurology', 8),
    ('step2ck', 'Obstetrics & Gynecology', 9),
    ('step2ck', 'Pediatrics', 10),
    ('step2ck', 'Psychiatry', 11),
    ('step2ck', 'Pulmonary & Critical Care', 12),
    ('step2ck', 'Renal & Genitourinary', 13),
    ('step2ck', 'Rheumatology', 14),
    ('step2ck', 'Surgery & ER', 15),
    ('step2ck', 'Biostatistics & Epidemiology', 16),
    ('step2ck', 'Ethics & Patient Safety', 17)
ON CONFLICT (step, system_name) DO NOTHING;

-- Inserir sistemas Step 3
INSERT INTO usmle_systems (step, system_name, display_order) VALUES
    ('step3', 'Allergy & Immunology', 1),
    ('step3', 'Cardiovascular', 2),
    ('step3', 'Dermatology', 3),
    ('step3', 'Endocrine', 4),
    ('step3', 'Gastrointestinal', 5),
    ('step3', 'Geriatrics', 6),
    ('step3', 'Hematology & Oncology', 7),
    ('step3', 'Infectious Disease', 8),
    ('step3', 'Musculoskeletal', 9),
    ('step3', 'Nephrology', 10),
    ('step3', 'Neurology', 11),
    ('step3', 'Obstetrics & Gynecology', 12),
    ('step3', 'Ophthalmology', 13),
    ('step3', 'Otolaryngology', 14),
    ('step3', 'Pediatrics', 15),
    ('step3', 'Psychiatry', 16),
    ('step3', 'Pulmonary & Critical Care', 17),
    ('step3', 'Rheumatology', 18),
    ('step3', 'Surgery', 19),
    ('step3', 'Urology', 20),
    ('step3', 'Biostatistics & Epidemiology', 21),
    ('step3', 'Ethics & Professionalism', 22)
ON CONFLICT (step, system_name) DO NOTHING;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_completed ON schedules(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_schedules_system ON schedules(system);
CREATE INDEX IF NOT EXISTS idx_schedule_delays_user ON schedule_delays(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_delays_dates ON schedule_delays(start_date, end_date);

-- Trigger para updated_at
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
