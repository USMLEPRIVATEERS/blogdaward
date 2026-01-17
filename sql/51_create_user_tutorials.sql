-- Table to track which tutorials users have watched
-- Used to avoid showing tutorials repeatedly

CREATE TABLE IF NOT EXISTS user_tutorials (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_key VARCHAR(100) NOT NULL,
    watched BOOLEAN DEFAULT FALSE,
    watched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint to ensure one record per user per tutorial
    UNIQUE(user_id, tutorial_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON user_tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tutorials_tutorial_key ON user_tutorials(tutorial_key);
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_tutorial ON user_tutorials(user_id, tutorial_key);

-- Enable Row Level Security
ALTER TABLE user_tutorials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tutorial records
CREATE POLICY "Users can view own tutorial records"
    ON user_tutorials
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own tutorial records
CREATE POLICY "Users can insert own tutorial records"
    ON user_tutorials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tutorial records
CREATE POLICY "Users can update own tutorial records"
    ON user_tutorials
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Mentors can view all tutorial records (for analytics)
CREATE POLICY "Mentors can view all tutorial records"
    ON user_tutorials
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('mentor', 'mentor_admin', 'admin')
        )
    );

-- Grant permissions
GRANT ALL ON user_tutorials TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_tutorials_id_seq TO authenticated;

-- Comment on table
COMMENT ON TABLE user_tutorials IS 'Tracks which tutorials each user has watched to avoid showing them repeatedly';
COMMENT ON COLUMN user_tutorials.tutorial_key IS 'Unique identifier for the tutorial (e.g., cronograma_tutorial, dashboard_tutorial)';
COMMENT ON COLUMN user_tutorials.watched IS 'Whether the user has marked this tutorial as watched';
COMMENT ON COLUMN user_tutorials.watched_at IS 'Timestamp when the user marked the tutorial as watched';
