-- Create mentor_settings table for mentor-specific configuration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mentor_settings (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    min_days_ahead INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id)
);

-- Enable RLS
ALTER TABLE mentor_settings ENABLE ROW LEVEL SECURITY;

-- Allow mentors to manage their own settings
CREATE POLICY "Mentors can view their own settings"
    ON mentor_settings
    FOR SELECT
    USING (
        mentor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role LIKE 'mentor_%')
    );

CREATE POLICY "Mentors can update their own settings"
    ON mentor_settings
    FOR UPDATE
    USING (mentor_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Mentors can insert their own settings"
    ON mentor_settings
    FOR INSERT
    WITH CHECK (mentor_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- All authenticated users can read mentor settings (for availability display)
CREATE POLICY "Students can read mentor settings"
    ON mentor_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mentor_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mentor_settings_timestamp
    BEFORE UPDATE ON mentor_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_mentor_settings_timestamp();

-- Insert default settings for existing mentors
INSERT INTO mentor_settings (mentor_id, min_days_ahead)
SELECT id, 2 FROM users WHERE role LIKE 'mentor_%'
ON CONFLICT (mentor_id) DO NOTHING;
