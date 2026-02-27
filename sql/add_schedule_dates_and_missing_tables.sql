-- Add start_date and end_date columns to schedules table
-- Run this in Supabase SQL Editor

-- Add date columns to schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create user_preparation_status table (for Diario de Estudos/UWorld)
CREATE TABLE IF NOT EXISTS user_preparation_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_diary_enabled BOOLEAN DEFAULT false,
    uworld_diary_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preparation_status ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for user_preparation_status" ON user_preparation_status
    FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON user_preparation_status TO anon;
GRANT ALL ON user_preparation_status TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_preparation_status_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE user_preparation_status_id_seq TO authenticated;

-- Create study_diary table
-- NOTE: See sql/07_diaries.sql for full schema
-- And sql/fix_study_diary_schema.sql for migration
CREATE TABLE IF NOT EXISTS study_diary (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours DECIMAL(4,2), -- Horas de estudo
    mood VARCHAR(20), -- great, good, neutral, tired, stressed
    topics TEXT, -- Topicos estudados
    notes TEXT, -- Anotacoes
    resources JSONB DEFAULT '[]'::jsonb, -- Recursos usados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE study_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for study_diary" ON study_diary FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON study_diary TO anon;
GRANT ALL ON study_diary TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE study_diary_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE study_diary_id_seq TO authenticated;

-- Create uworld_diary table
CREATE TABLE IF NOT EXISTS uworld_diary (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    questions_done INTEGER DEFAULT 0,
    correct_percentage DECIMAL(5,2),
    time_spent_minutes INTEGER,
    system_topic VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE uworld_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for uworld_diary" ON uworld_diary FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON uworld_diary TO anon;
GRANT ALL ON uworld_diary TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE uworld_diary_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE uworld_diary_id_seq TO authenticated;

COMMENT ON TABLE schedules IS 'Study schedule with start/end dates for each topic';
COMMENT ON TABLE user_preparation_status IS 'Tracks which diaries are enabled for each user';
COMMENT ON TABLE study_diary IS 'Daily study diary entries';
COMMENT ON TABLE uworld_diary IS 'UWorld practice diary entries';
