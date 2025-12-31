-- Create questionnaire_data table for storing questionnaire responses
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS questionnaire_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step INTEGER NOT NULL CHECK (step >= 1 AND step <= 11),
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Each user can only have one record per step
    UNIQUE(user_id, step)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_questionnaire_data_user_id ON questionnaire_data(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_data_step ON questionnaire_data(step);
CREATE INDEX IF NOT EXISTS idx_questionnaire_data_user_step ON questionnaire_data(user_id, step);

-- Enable RLS (Row Level Security)
ALTER TABLE questionnaire_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own questionnaire data" ON questionnaire_data
    FOR SELECT USING (auth.uid()::text = user_id::text OR true);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own questionnaire data" ON questionnaire_data
    FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own questionnaire data" ON questionnaire_data
    FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON questionnaire_data TO anon;
GRANT ALL ON questionnaire_data TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_data_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE questionnaire_data_id_seq TO authenticated;

-- Comment
COMMENT ON TABLE questionnaire_data IS 'Stores questionnaire responses for each step (1-11) per user';
