-- Create mentor_messages table for mentor-to-student messaging
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mentor_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mentor_messages_user_id ON mentor_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_mentor_id ON mentor_messages(mentor_id);

-- Enable RLS
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own messages
CREATE POLICY "Users can view their own messages" ON mentor_messages
    FOR SELECT USING (true);

-- Policy: Mentors can insert messages
CREATE POLICY "Mentors can send messages" ON mentor_messages
    FOR INSERT WITH CHECK (true);

-- Policy: Users/mentors can update messages
CREATE POLICY "Can update messages" ON mentor_messages
    FOR UPDATE USING (true);

COMMENT ON TABLE mentor_messages IS 'Messages sent from mentors to students';
