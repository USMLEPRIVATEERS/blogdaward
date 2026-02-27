-- Add break_minutes column to mentor availability tables
-- This allows mentors to configure breaks between consecutive call slots

-- Add to regular availability table
ALTER TABLE mentor_availability_regular
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0 CHECK (break_minutes >= 0);

-- Add to specific availability table
ALTER TABLE mentor_availability_specific
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0 CHECK (break_minutes >= 0);

COMMENT ON COLUMN mentor_availability_regular.break_minutes IS 'Break time in minutes between consecutive call slots';
COMMENT ON COLUMN mentor_availability_specific.break_minutes IS 'Break time in minutes between consecutive call slots';
