-- ============================================
-- MIGRATION: Add ON DELETE CASCADE to Self Assessment tables
-- This ensures user data is properly deleted when a user is removed
-- ============================================

-- Step 1: Drop existing foreign key constraints
ALTER TABLE self_assessment_enrollments
DROP CONSTRAINT IF EXISTS self_assessment_enrollments_user_id_fkey;

ALTER TABLE self_assessment_enrollments
DROP CONSTRAINT IF EXISTS self_assessment_enrollments_self_assessment_id_fkey;

ALTER TABLE self_assessment_attempts
DROP CONSTRAINT IF EXISTS self_assessment_attempts_enrollment_id_fkey;

ALTER TABLE self_assessment_responses
DROP CONSTRAINT IF EXISTS self_assessment_responses_enrollment_id_fkey;

ALTER TABLE self_assessment_responses
DROP CONSTRAINT IF EXISTS self_assessment_responses_attempt_id_fkey;

ALTER TABLE self_assessment_responses
DROP CONSTRAINT IF EXISTS self_assessment_responses_question_id_fkey;

-- Step 2: Re-add foreign key constraints WITH CASCADE

-- Enrollments: cascade on user delete and assessment delete
ALTER TABLE self_assessment_enrollments
ADD CONSTRAINT self_assessment_enrollments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE self_assessment_enrollments
ADD CONSTRAINT self_assessment_enrollments_self_assessment_id_fkey
FOREIGN KEY (self_assessment_id) REFERENCES self_assessments(id) ON DELETE CASCADE;

-- Attempts: cascade on enrollment delete
ALTER TABLE self_assessment_attempts
ADD CONSTRAINT self_assessment_attempts_enrollment_id_fkey
FOREIGN KEY (enrollment_id) REFERENCES self_assessment_enrollments(id) ON DELETE CASCADE;

-- Responses: cascade on enrollment, attempt, and question delete
ALTER TABLE self_assessment_responses
ADD CONSTRAINT self_assessment_responses_enrollment_id_fkey
FOREIGN KEY (enrollment_id) REFERENCES self_assessment_enrollments(id) ON DELETE CASCADE;

ALTER TABLE self_assessment_responses
ADD CONSTRAINT self_assessment_responses_attempt_id_fkey
FOREIGN KEY (attempt_id) REFERENCES self_assessment_attempts(id) ON DELETE CASCADE;

ALTER TABLE self_assessment_responses
ADD CONSTRAINT self_assessment_responses_question_id_fkey
FOREIGN KEY (question_id) REFERENCES self_assessment_questions(id) ON DELETE CASCADE;

-- Verify the constraints were added
SELECT
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name LIKE 'self_assessment%'
    AND tc.constraint_type = 'FOREIGN KEY';
