-- ============================================
-- WARD ACADEMY - INTERNAL SELF ASSESSMENTS & NEW ENROLLMENT FIELDS
-- Migration for adding internal assessment support and new enrollment questions
-- ============================================

-- =============================================
-- PART 1: Add internal assessment support to assessments table
-- =============================================

-- Add columns for internal self assessment linking
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS internal_self_assessment_id BIGINT REFERENCES self_assessments(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessments_internal ON assessments(is_internal);
CREATE INDEX IF NOT EXISTS idx_assessments_internal_sa_id ON assessments(internal_self_assessment_id);

-- Comment explaining the fields
COMMENT ON COLUMN assessments.is_internal IS 'True if this assessment uses an internal self_assessment instead of external Google Forms';
COMMENT ON COLUMN assessments.internal_self_assessment_id IS 'Reference to self_assessments table for internal assessments';

-- =============================================
-- PART 2: Add new enrollment fields to self_assessment_enrollments
-- =============================================

-- Study timeline fields
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS study_start_date DATE,
ADD COLUMN IF NOT EXISTS planned_step1_date DATE;

-- UWorld progress fields
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS uworld_progress INTEGER CHECK (uworld_progress >= 0 AND uworld_progress <= 100),
ADD COLUMN IF NOT EXISTS uworld_accuracy INTEGER CHECK (uworld_accuracy >= 0 AND uworld_accuracy <= 100),
ADD COLUMN IF NOT EXISTS uworld_systems TEXT[], -- Array of system codes
ADD COLUMN IF NOT EXISTS uworld_usage TEXT;

-- Other resource usage fields
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS anki_usage TEXT,
ADD COLUMN IF NOT EXISTS bnb_usage TEXT;

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_enrollments_uworld_progress ON self_assessment_enrollments(uworld_progress);
CREATE INDEX IF NOT EXISTS idx_enrollments_uworld_accuracy ON self_assessment_enrollments(uworld_accuracy);
CREATE INDEX IF NOT EXISTS idx_enrollments_study_start ON self_assessment_enrollments(study_start_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_planned_step1 ON self_assessment_enrollments(planned_step1_date);

-- Comments explaining the new fields
COMMENT ON COLUMN self_assessment_enrollments.study_start_date IS 'Date when student started studying for Step 1';
COMMENT ON COLUMN self_assessment_enrollments.planned_step1_date IS 'Approximate date student plans to take USMLE Step 1';
COMMENT ON COLUMN self_assessment_enrollments.uworld_progress IS 'Percentage of UWorld completed (first pass)';
COMMENT ON COLUMN self_assessment_enrollments.uworld_accuracy IS 'Current accuracy percentage in UWorld';
COMMENT ON COLUMN self_assessment_enrollments.uworld_systems IS 'Array of UWorld systems the student has practiced';
COMMENT ON COLUMN self_assessment_enrollments.uworld_usage IS 'How student uses UWorld (diariamente, irregularmente, nao_uso, outro:...)';
COMMENT ON COLUMN self_assessment_enrollments.anki_usage IS 'How student uses Anki with Anking deck';
COMMENT ON COLUMN self_assessment_enrollments.bnb_usage IS 'How student uses Boards & Beyond';

-- =============================================
-- PART 3: Create view for enrollment analytics
-- =============================================

CREATE OR REPLACE VIEW self_assessment_enrollment_analytics AS
SELECT
    e.id,
    e.user_id,
    e.self_assessment_id,
    u.name as student_name,
    u.email as student_email,
    sa.name as assessment_name,
    e.study_start_date,
    e.planned_step1_date,
    e.uworld_progress,
    e.uworld_accuracy,
    e.uworld_systems,
    e.uworld_usage,
    e.anki_usage,
    e.bnb_usage,
    e.scheduled_datetime_utc,
    e.status,
    e.enrolled_at,
    -- Calculate days studying
    CASE
        WHEN e.study_start_date IS NOT NULL THEN
            (CURRENT_DATE - e.study_start_date)
        ELSE NULL
    END as days_studying,
    -- Calculate days until planned Step 1
    CASE
        WHEN e.planned_step1_date IS NOT NULL THEN
            (e.planned_step1_date - CURRENT_DATE)
        ELSE NULL
    END as days_until_step1
FROM self_assessment_enrollments e
JOIN users u ON e.user_id = u.id
JOIN self_assessments sa ON e.self_assessment_id = sa.id;

-- Comment on view
COMMENT ON VIEW self_assessment_enrollment_analytics IS 'View for analyzing student enrollment data including study habits and progress';
