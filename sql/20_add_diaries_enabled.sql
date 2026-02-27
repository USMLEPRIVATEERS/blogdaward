-- Add diaries_enabled column to users table
-- This stores user preference for enabling both study and uworld diaries

ALTER TABLE users
ADD COLUMN IF NOT EXISTS diaries_enabled BOOLEAN DEFAULT false;

-- Update existing users: if they're using localStorage, migrate the preference
-- Note: This will need to be run manually or via a script since we can't access localStorage from SQL
COMMENT ON COLUMN users.diaries_enabled IS 'Indicates if user has enabled diary features (both study and uworld)';
