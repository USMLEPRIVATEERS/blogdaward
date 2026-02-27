-- ============================================
-- WARD ACADEMY - SELF ASSESSMENT ENROLLMENT DATA
-- Migration for adding student enrollment information fields
-- ============================================

-- Add enrollment data columns to self_assessment_enrollments
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS study_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS graduation_date DATE,
ADD COLUMN IF NOT EXISTS current_institution TEXT,
ADD COLUMN IF NOT EXISTS current_address TEXT;

-- Create index for faster filtering by study stage
CREATE INDEX IF NOT EXISTS idx_enrollments_study_stage
ON self_assessment_enrollments(study_stage);

-- Comment explaining the fields
COMMENT ON COLUMN self_assessment_enrollments.study_stage IS 'Student study stage: iniciando, step1, step2ck, step3';
COMMENT ON COLUMN self_assessment_enrollments.graduation_date IS 'Expected or actual graduation date';
COMMENT ON COLUMN self_assessment_enrollments.current_institution IS 'Current educational institution';
COMMENT ON COLUMN self_assessment_enrollments.current_address IS 'Current location (city, state, country)';
