-- Add schedule_type column to users table
-- Values: 'subject' (default - by System Subject) or 'category' (by System Category)

ALTER TABLE users ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(20) DEFAULT 'subject';

-- Add comment explaining the field
COMMENT ON COLUMN users.schedule_type IS 'Type of schedule: subject (System/Subject columns - default) or category (System/Category columns)';
