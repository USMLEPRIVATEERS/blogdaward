-- Add fields for assessoria (limited access) users
-- Users can show interest in full membership

-- Add columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS interested_in_full_membership BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interest_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_interested ON users(interested_in_full_membership)
WHERE interested_in_full_membership = TRUE;

-- Comment
COMMENT ON COLUMN users.interested_in_full_membership IS 'Whether assessoria user has shown interest in becoming full member';
COMMENT ON COLUMN users.interest_date IS 'Date when assessoria user showed interest in full membership';
