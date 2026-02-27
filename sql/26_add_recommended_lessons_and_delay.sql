-- ============================================
-- Add recommended_lessons and delay_reported columns to schedules table
-- ============================================

-- Add recommended_lessons column to store study materials
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS recommended_lessons TEXT;

-- Add delay_reported column to track when student reports delays
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS delay_reported BOOLEAN DEFAULT FALSE;

-- Add delay_reported_at to track when delay was reported
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS delay_reported_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on delayed items
CREATE INDEX IF NOT EXISTS idx_schedules_delay_reported
ON schedules(delay_reported, user_id);

COMMENT ON COLUMN schedules.recommended_lessons IS 'Study materials and recommended lessons (e.g., B&B videos, Sketchy topics)';
COMMENT ON COLUMN schedules.delay_reported IS 'Whether student has reported delay on this item';
COMMENT ON COLUMN schedules.delay_reported_at IS 'Timestamp when delay was reported';
