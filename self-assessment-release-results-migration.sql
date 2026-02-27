-- =============================================
-- MIGRATION: Add early results release support
-- Run this in Supabase SQL Editor
-- =============================================

-- Add column for tracking when results were released early by a mentor
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS results_released_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN self_assessment_enrollments.results_released_at IS 'Timestamp when mentor released results early. If set, student can view results immediately without waiting 24h.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_results_released ON self_assessment_enrollments(results_released_at);
