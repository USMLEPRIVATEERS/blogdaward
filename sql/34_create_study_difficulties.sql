-- Create table for student study difficulties
-- Stores when students signal they're having trouble with specific topics

CREATE TABLE IF NOT EXISTS study_difficulties (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    system VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty_description TEXT NOT NULL,
    correct_percentage INTEGER CHECK (correct_percentage >= 0 AND correct_percentage <= 100),
    wants_meeting BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_difficulties_user ON study_difficulties(user_id);
CREATE INDEX IF NOT EXISTS idx_study_difficulties_resolved ON study_difficulties(resolved);
CREATE INDEX IF NOT EXISTS idx_study_difficulties_created ON study_difficulties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_difficulties_wants_meeting ON study_difficulties(wants_meeting) WHERE wants_meeting = true;

-- Enable RLS
ALTER TABLE study_difficulties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for study_difficulties" ON study_difficulties
    FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON study_difficulties TO anon;
GRANT ALL ON study_difficulties TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE study_difficulties_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE study_difficulties_id_seq TO authenticated;

-- Comments
COMMENT ON TABLE study_difficulties IS 'Student-reported study difficulties and support requests';
COMMENT ON COLUMN study_difficulties.difficulty_description IS 'What the student is struggling with';
COMMENT ON COLUMN study_difficulties.correct_percentage IS 'Percentage of questions answered correctly (0-100)';
COMMENT ON COLUMN study_difficulties.wants_meeting IS 'Student requested meeting with Dr. Iria';
COMMENT ON COLUMN study_difficulties.resolved IS 'Whether the difficulty has been addressed';
