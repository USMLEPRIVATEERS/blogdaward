-- Add pass_type column to users table
-- This column tracks which pass the student is doing (first, second, third)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS pass_type VARCHAR(20) DEFAULT 'first' CHECK (pass_type IN ('first', 'second', 'third'));

COMMENT ON COLUMN users.pass_type IS 'Type of pass student is doing: first, second, or third';
