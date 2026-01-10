-- ============================================
-- MIGRATION: Add internal self assessment support to assessments table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add columns to support internal self assessments
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS internal_self_assessment_id INTEGER REFERENCES self_assessments(id),
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Create index for internal assessment lookup
CREATE INDEX IF NOT EXISTS idx_assessments_internal
ON assessments(internal_self_assessment_id)
WHERE internal_self_assessment_id IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assessments'
AND column_name IN ('internal_self_assessment_id', 'is_internal');
