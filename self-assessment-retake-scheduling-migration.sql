-- ============================================
-- MIGRATION: Add retake scheduling columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add columns for student's requested retake date/time
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS retake_requested_datetime_utc TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retake_requested_timezone VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS scheduled_timezone VARCHAR(50) DEFAULT NULL;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'self_assessment_enrollments'
AND column_name IN ('retake_requested_datetime_utc', 'retake_requested_timezone', 'scheduled_timezone');
