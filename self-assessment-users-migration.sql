-- ============================================
-- MIGRATION: Add columns for external users
-- Run this BEFORE using the Self Assessment feature
-- ============================================

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add whatsapp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'whatsapp') THEN
        ALTER TABLE users ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

-- Create index on email for faster lookups (unique constraint optional)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Note: The 'externo' role is handled via the existing 'role' column in users table
