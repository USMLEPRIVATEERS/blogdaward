-- Add schedule_type column to users table
-- Values: 'category' (default - by System Category) or 'subject' (by System Subject)

ALTER TABLE users ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(20) DEFAULT 'category';

-- Add comment explaining the field
COMMENT ON COLUMN users.schedule_type IS 'Type of schedule: category (System/Category columns) or subject (System/Subject columns)';
