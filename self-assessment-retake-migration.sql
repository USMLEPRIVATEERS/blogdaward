-- ============================================
-- MIGRATION: Add retake request columns to enrollments
-- Run this in Supabase SQL Editor
-- ============================================

-- Add columns for retake requests
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS retake_requested_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retake_request_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retake_approved_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retake_denied_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retake_response_by INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retake_count INTEGER DEFAULT 0;

-- Create index for faster queries on pending requests
CREATE INDEX IF NOT EXISTS idx_enrollments_retake_requested ON self_assessment_enrollments(retake_requested_at)
WHERE retake_requested_at IS NOT NULL AND retake_approved_at IS NULL AND retake_denied_at IS NULL;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'self_assessment_enrollments'
AND column_name LIKE 'retake%';
