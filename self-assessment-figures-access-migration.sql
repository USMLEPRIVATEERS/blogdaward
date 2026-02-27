-- ============================================
-- WARD ACADEMY - SELF ASSESSMENT ACCESS TYPE & FIGURES
-- Migration for adding access control and question figures
-- ============================================

-- =============================================
-- PART 1: Add access_type to self_assessments
-- =============================================

-- Add access_type column
-- NULL = open to everyone (external users and Ward members)
-- 'i' = internal only (Ward Academy members only)
ALTER TABLE self_assessments
ADD COLUMN IF NOT EXISTS access_type CHAR(1) DEFAULT NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_self_assessments_access_type ON self_assessments(access_type);

-- Comment explaining the field
COMMENT ON COLUMN self_assessments.access_type IS 'Access control: NULL = open to all, ''i'' = internal (Ward Academy members only)';

-- =============================================
-- PART 2: Add figures column to questions
-- =============================================

-- Add figures column for storing image URLs (comma and space separated)
ALTER TABLE self_assessment_questions
ADD COLUMN IF NOT EXISTS figures TEXT DEFAULT NULL;

-- Comment explaining the field
COMMENT ON COLUMN self_assessment_questions.figures IS 'Comma and space separated URLs of figure images for this question. Example: "url1, url2, url3"';
