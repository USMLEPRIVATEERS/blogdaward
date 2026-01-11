-- =============================================
-- FIX STUDY_DIARY TABLE SCHEMA
-- Ensures the table has all columns expected by the JavaScript code
-- Run this in Supabase SQL Editor
-- =============================================

-- First, check if the table exists and add missing columns

-- Add 'hours' column if it doesn't exist (the JS expects 'hours', not 'study_hours' or 'hours_studied')
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'hours') THEN
        ALTER TABLE study_diary ADD COLUMN hours DECIMAL(4,2);
    END IF;
END $$;

-- Add 'topics' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'topics') THEN
        ALTER TABLE study_diary ADD COLUMN topics TEXT;
    END IF;
END $$;

-- Add 'notes' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'notes') THEN
        ALTER TABLE study_diary ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add 'mood' column if it doesn't exist (with correct check constraint)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'mood') THEN
        ALTER TABLE study_diary ADD COLUMN mood VARCHAR(20);
    END IF;
END $$;

-- Add 'resources' column if it doesn't exist (as JSONB array)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'resources') THEN
        ALTER TABLE study_diary ADD COLUMN resources JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add 'updated_at' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'updated_at') THEN
        ALTER TABLE study_diary ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Drop any existing mood check constraint that might conflict
DO $$
BEGIN
    ALTER TABLE study_diary DROP CONSTRAINT IF EXISTS study_diary_mood_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Optionally migrate data from old column names if they exist
DO $$
BEGIN
    -- Migrate from study_hours to hours if study_hours exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'study_hours') THEN
        UPDATE study_diary SET hours = study_hours WHERE hours IS NULL AND study_hours IS NOT NULL;
    END IF;

    -- Migrate from hours_studied to hours if hours_studied exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'hours_studied') THEN
        UPDATE study_diary SET hours = hours_studied WHERE hours IS NULL AND hours_studied IS NOT NULL;
    END IF;

    -- Migrate from topics_covered to topics if topics_covered exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'topics_covered') THEN
        UPDATE study_diary SET topics = topics_covered WHERE topics IS NULL AND topics_covered IS NOT NULL;
    END IF;

    -- Migrate from entry_text to notes if entry_text exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_diary' AND column_name = 'entry_text') THEN
        UPDATE study_diary SET notes = entry_text WHERE notes IS NULL AND entry_text IS NOT NULL;
    END IF;
END $$;

-- Ensure RLS is enabled and policies exist
ALTER TABLE study_diary ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to ensure it exists
DROP POLICY IF EXISTS "Allow all for study_diary" ON study_diary;
CREATE POLICY "Allow all for study_diary" ON study_diary FOR ALL USING (true) WITH CHECK (true);

-- Ensure proper grants
GRANT ALL ON study_diary TO anon;
GRANT ALL ON study_diary TO authenticated;

-- Create updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_study_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_study_diary_updated_at ON study_diary;
CREATE TRIGGER set_study_diary_updated_at
    BEFORE UPDATE ON study_diary
    FOR EACH ROW EXECUTE FUNCTION update_study_diary_updated_at();

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_study_diary_user_id ON study_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_study_diary_date ON study_diary(date DESC);
CREATE INDEX IF NOT EXISTS idx_study_diary_user_date ON study_diary(user_id, date);
