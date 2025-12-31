-- Course Videos Table for Ward Academy
-- Tags are hierarchical using :: separator (e.g., "USMLE::STEP_1::INTRODUCAO")

CREATE TABLE IF NOT EXISTS course_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    tags VARCHAR(500) NOT NULL,  -- Hierarchical tags like "USMLE::STEP_1::INTRODUCAO"
    video_url TEXT,              -- YouTube or Vimeo URL (nullable)
    description TEXT,            -- Video/lesson description (nullable)
    thumbnail_url TEXT,          -- Optional thumbnail image
    duration_minutes INTEGER,    -- Video duration in minutes
    order_position INTEGER DEFAULT 0,  -- For ordering within category
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table for course videos
CREATE TABLE IF NOT EXISTS course_video_comments (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES course_videos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_course_videos_tags ON course_videos(tags);
CREATE INDEX IF NOT EXISTS idx_course_videos_published ON course_videos(is_published);

-- Sample data to demonstrate structure
INSERT INTO course_videos (title, tags, video_url, description, order_position) VALUES
    ('Bem-vindo a Ward Academy', 'WARD_ACADEMY::INTRODUCAO', NULL, 'Conheca a Ward Academy e nossa metodologia de ensino para o USMLE.', 1),
    ('O que e o USMLE?', 'USMLE::STEP_1::INTRODUCAO', NULL, 'Entenda a estrutura do USMLE e como funciona cada Step.', 1),
    ('Planejamento de Estudos', 'USMLE::STEP_1::INTRODUCAO', NULL, 'Como montar seu cronograma de estudos para o Step 1.', 2),
    ('UWorld - Como usar', 'USMLE::STEP_1::RECURSOS', NULL, 'Tutorial completo do UWorld e estrategias de estudo.', 1),
    ('Anki para USMLE', 'USMLE::STEP_1::RECURSOS', NULL, 'Como configurar e usar o Anki de forma eficiente.', 2),
    ('Introducao a Pesquisa', 'PESQUISA::INTRODUCAO', NULL, 'Primeiros passos para iniciar sua carreira em pesquisa.', 1),
    ('Como fazer uma Revisao Sistematica', 'PESQUISA::META_ANALISE', NULL, 'Guia completo para revisoes sistematicas e meta-analises.', 1);

-- Enable RLS
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_video_comments ENABLE ROW LEVEL SECURITY;

-- Policies - everyone can view published videos
CREATE POLICY "Anyone can view published videos" ON course_videos
    FOR SELECT USING (is_published = true);

-- Only mentors can insert/update/delete videos
CREATE POLICY "Mentors can manage videos" ON course_videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::integer
            AND users.role LIKE 'mentor_%'
        )
    );

-- Comments policies
CREATE POLICY "Anyone can view comments" ON course_video_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON course_video_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own comments" ON course_video_comments
    FOR DELETE USING (user_id = auth.uid()::integer);
