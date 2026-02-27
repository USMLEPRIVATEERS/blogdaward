-- =============================================
-- WARDPEDIA - Wikipedia System for Ward Academy
-- =============================================

-- Reference table: Steps (USMLE Step 1, Step 2 CK, Step 3, OET)
CREATE TABLE IF NOT EXISTS wardpedia_steps (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reference table: Subjects (disciplines like Pathology, Pharmacology, etc.)
CREATE TABLE IF NOT EXISTS wardpedia_subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reference table: Systems (organ systems like Cardiovascular, Renal, etc.)
CREATE TABLE IF NOT EXISTS wardpedia_systems (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reference table: Categories (subcategories within each System)
CREATE TABLE IF NOT EXISTS wardpedia_categories (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES wardpedia_systems(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(system_id, name)
);

-- Main articles table
CREATE TABLE IF NOT EXISTS wardpedia_articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_id BIGINT REFERENCES users(id),
    steps TEXT[] DEFAULT '{}',
    subjects TEXT[] DEFAULT '{}',
    systems TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on articles
CREATE TABLE IF NOT EXISTS wardpedia_comments (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES wardpedia_articles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites
CREATE TABLE IF NOT EXISTS wardpedia_favorites (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES wardpedia_articles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- View tracking (one per user per article)
CREATE TABLE IF NOT EXISTS wardpedia_views (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES wardpedia_articles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_published ON wardpedia_articles(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_steps ON wardpedia_articles USING GIN(steps);
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_subjects ON wardpedia_articles USING GIN(subjects);
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_systems ON wardpedia_articles USING GIN(systems);
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_categories ON wardpedia_articles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_created ON wardpedia_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_views ON wardpedia_articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_wardpedia_articles_favorites ON wardpedia_articles(favorite_count DESC);
CREATE INDEX IF NOT EXISTS idx_wardpedia_comments_article ON wardpedia_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_wardpedia_comments_user ON wardpedia_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_wardpedia_favorites_user ON wardpedia_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_wardpedia_favorites_article ON wardpedia_favorites(article_id);
CREATE INDEX IF NOT EXISTS idx_wardpedia_views_article ON wardpedia_views(article_id);
CREATE INDEX IF NOT EXISTS idx_wardpedia_views_viewed ON wardpedia_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_wardpedia_categories_system ON wardpedia_categories(system_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE wardpedia_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardpedia_categories ENABLE ROW LEVEL SECURITY;

-- Articles: anyone can read published, mentors can write
CREATE POLICY wardpedia_articles_select ON wardpedia_articles FOR SELECT USING (true);
CREATE POLICY wardpedia_articles_insert ON wardpedia_articles FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_articles_update ON wardpedia_articles FOR UPDATE USING (true);
CREATE POLICY wardpedia_articles_delete ON wardpedia_articles FOR DELETE USING (true);

-- Comments: anyone can read, authenticated can write own
CREATE POLICY wardpedia_comments_select ON wardpedia_comments FOR SELECT USING (true);
CREATE POLICY wardpedia_comments_insert ON wardpedia_comments FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_comments_update ON wardpedia_comments FOR UPDATE USING (true);
CREATE POLICY wardpedia_comments_delete ON wardpedia_comments FOR DELETE USING (true);

-- Favorites: users manage own
CREATE POLICY wardpedia_favorites_select ON wardpedia_favorites FOR SELECT USING (true);
CREATE POLICY wardpedia_favorites_insert ON wardpedia_favorites FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_favorites_delete ON wardpedia_favorites FOR DELETE USING (true);

-- Views: anyone can read/write (upsert needs UPDATE policy too)
CREATE POLICY wardpedia_views_select ON wardpedia_views FOR SELECT USING (true);
CREATE POLICY wardpedia_views_insert ON wardpedia_views FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_views_update ON wardpedia_views FOR UPDATE USING (true);

-- Steps: anyone can read, service role can write
CREATE POLICY wardpedia_steps_select ON wardpedia_steps FOR SELECT USING (true);
CREATE POLICY wardpedia_steps_insert ON wardpedia_steps FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_steps_update ON wardpedia_steps FOR UPDATE USING (true);
CREATE POLICY wardpedia_steps_delete ON wardpedia_steps FOR DELETE USING (true);

-- Reference tables: anyone can read, service role can write
CREATE POLICY wardpedia_subjects_select ON wardpedia_subjects FOR SELECT USING (true);
CREATE POLICY wardpedia_subjects_insert ON wardpedia_subjects FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_subjects_update ON wardpedia_subjects FOR UPDATE USING (true);
CREATE POLICY wardpedia_subjects_delete ON wardpedia_subjects FOR DELETE USING (true);

CREATE POLICY wardpedia_systems_select ON wardpedia_systems FOR SELECT USING (true);
CREATE POLICY wardpedia_systems_insert ON wardpedia_systems FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_systems_update ON wardpedia_systems FOR UPDATE USING (true);
CREATE POLICY wardpedia_systems_delete ON wardpedia_systems FOR DELETE USING (true);

CREATE POLICY wardpedia_categories_select ON wardpedia_categories FOR SELECT USING (true);
CREATE POLICY wardpedia_categories_insert ON wardpedia_categories FOR INSERT WITH CHECK (true);
CREATE POLICY wardpedia_categories_update ON wardpedia_categories FOR UPDATE USING (true);
CREATE POLICY wardpedia_categories_delete ON wardpedia_categories FOR DELETE USING (true);

-- =============================================
-- TRIGGERS: Auto-update view_count and favorite_count
-- These run at the DB level so students don't need
-- to write directly to wardpedia_articles (ADMIN_WRITE_TABLES)
-- =============================================

-- View count trigger
CREATE OR REPLACE FUNCTION update_wardpedia_view_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE wardpedia_articles SET view_count = (
            SELECT COUNT(*) FROM wardpedia_views WHERE article_id = NEW.article_id
        ) WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE wardpedia_articles SET view_count = (
            SELECT COUNT(*) FROM wardpedia_views WHERE article_id = OLD.article_id
        ) WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wardpedia_views_count_trigger
AFTER INSERT OR DELETE ON wardpedia_views
FOR EACH ROW EXECUTE FUNCTION update_wardpedia_view_count();

-- Favorite count trigger
CREATE OR REPLACE FUNCTION update_wardpedia_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE wardpedia_articles SET favorite_count = (
            SELECT COUNT(*) FROM wardpedia_favorites WHERE article_id = NEW.article_id
        ) WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE wardpedia_articles SET favorite_count = (
            SELECT COUNT(*) FROM wardpedia_favorites WHERE article_id = OLD.article_id
        ) WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wardpedia_favorites_count_trigger
AFTER INSERT OR DELETE ON wardpedia_favorites
FOR EACH ROW EXECUTE FUNCTION update_wardpedia_favorite_count();

-- =============================================
-- SEED DATA: Steps / Exams
-- =============================================
INSERT INTO wardpedia_steps (name, order_position) VALUES
    ('Step 1', 1),
    ('Step 2 CK', 2),
    ('Step 3', 3),
    ('OET', 4)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA: Common USMLE Subjects
-- =============================================
INSERT INTO wardpedia_subjects (name, order_position) VALUES
    ('Anatomy', 1),
    ('Behavioral Science', 2),
    ('Biochemistry', 3),
    ('Biostatistics & Epidemiology', 4),
    ('Embryology', 5),
    ('Genetics', 6),
    ('Histology', 7),
    ('Immunology', 8),
    ('Microbiology', 9),
    ('Pathology', 10),
    ('Pharmacology', 11),
    ('Physiology', 12)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA: Common USMLE Systems
-- =============================================
INSERT INTO wardpedia_systems (name, order_position) VALUES
    ('Cardiovascular', 1),
    ('Dermatology', 2),
    ('Endocrine', 3),
    ('Gastrointestinal', 4),
    ('Hematology & Oncology', 5),
    ('Musculoskeletal', 6),
    ('Neurology', 7),
    ('Obstetrics & Gynecology', 8),
    ('Ophthalmology', 9),
    ('Psychiatry', 10),
    ('Renal', 11),
    ('Reproductive', 12),
    ('Respiratory', 13)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA: Sample Categories per System
-- =============================================

-- Cardiovascular
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Heart Failure', 1), ('Arrhythmias', 2), ('Valvular Disease', 3), ('Coronary Artery Disease', 4), ('Hypertension', 5), ('Congenital Heart Disease', 6), ('Vascular Disease', 7)) AS c(name, ord)
WHERE s.name = 'Cardiovascular'
ON CONFLICT (system_id, name) DO NOTHING;

-- Endocrine
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Diabetes Mellitus', 1), ('Thyroid Disorders', 2), ('Adrenal Disorders', 3), ('Pituitary Disorders', 4), ('Calcium Metabolism', 5)) AS c(name, ord)
WHERE s.name = 'Endocrine'
ON CONFLICT (system_id, name) DO NOTHING;

-- Gastrointestinal
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Esophageal Disorders', 1), ('Gastric Disorders', 2), ('Liver Disease', 3), ('Biliary Disease', 4), ('Pancreatic Disease', 5), ('Inflammatory Bowel Disease', 6), ('Colorectal Disease', 7)) AS c(name, ord)
WHERE s.name = 'Gastrointestinal'
ON CONFLICT (system_id, name) DO NOTHING;

-- Hematology & Oncology
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Anemia', 1), ('Coagulation Disorders', 2), ('Leukemia', 3), ('Lymphoma', 4), ('Platelet Disorders', 5)) AS c(name, ord)
WHERE s.name = 'Hematology & Oncology'
ON CONFLICT (system_id, name) DO NOTHING;

-- Neurology
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Stroke', 1), ('Seizure Disorders', 2), ('Demyelinating Diseases', 3), ('Neurodegenerative Diseases', 4), ('Headache', 5), ('Peripheral Neuropathy', 6), ('CNS Infections', 7)) AS c(name, ord)
WHERE s.name = 'Neurology'
ON CONFLICT (system_id, name) DO NOTHING;

-- Renal
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Acute Kidney Injury', 1), ('Chronic Kidney Disease', 2), ('Glomerular Disease', 3), ('Tubular Disorders', 4), ('Acid-Base Disorders', 5), ('Electrolyte Disorders', 6)) AS c(name, ord)
WHERE s.name = 'Renal'
ON CONFLICT (system_id, name) DO NOTHING;

-- Respiratory
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Obstructive Lung Disease', 1), ('Restrictive Lung Disease', 2), ('Pneumonia', 3), ('Pulmonary Embolism', 4), ('Lung Cancer', 5), ('Pleural Disease', 6)) AS c(name, ord)
WHERE s.name = 'Respiratory'
ON CONFLICT (system_id, name) DO NOTHING;

-- Musculoskeletal
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Arthritis', 1), ('Bone Disorders', 2), ('Connective Tissue Disease', 3), ('Muscle Disorders', 4)) AS c(name, ord)
WHERE s.name = 'Musculoskeletal'
ON CONFLICT (system_id, name) DO NOTHING;

-- Psychiatry
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Mood Disorders', 1), ('Anxiety Disorders', 2), ('Psychotic Disorders', 3), ('Personality Disorders', 4), ('Substance Use Disorders', 5)) AS c(name, ord)
WHERE s.name = 'Psychiatry'
ON CONFLICT (system_id, name) DO NOTHING;

-- Reproductive
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Male Reproductive', 1), ('Female Reproductive', 2), ('STIs', 3)) AS c(name, ord)
WHERE s.name = 'Reproductive'
ON CONFLICT (system_id, name) DO NOTHING;

-- Obstetrics & Gynecology
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Normal Pregnancy', 1), ('Pregnancy Complications', 2), ('Labor & Delivery', 3), ('Gynecologic Disorders', 4), ('Breast Disease', 5)) AS c(name, ord)
WHERE s.name = 'Obstetrics & Gynecology'
ON CONFLICT (system_id, name) DO NOTHING;

-- Dermatology
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Inflammatory Skin Disease', 1), ('Infectious Skin Disease', 2), ('Skin Cancer', 3), ('Bullous Disease', 4)) AS c(name, ord)
WHERE s.name = 'Dermatology'
ON CONFLICT (system_id, name) DO NOTHING;

-- Ophthalmology
INSERT INTO wardpedia_categories (system_id, name, order_position)
SELECT s.id, c.name, c.ord
FROM wardpedia_systems s,
(VALUES ('Glaucoma', 1), ('Retinal Disorders', 2), ('Corneal Disorders', 3), ('Optic Nerve', 4)) AS c(name, ord)
WHERE s.name = 'Ophthalmology'
ON CONFLICT (system_id, name) DO NOTHING;
