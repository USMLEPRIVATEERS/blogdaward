-- ============================================
-- WARD ACADEMY - SELF ASSESSMENT SCHEDULING
-- Migration for adding date/time scheduling
-- ============================================

-- Add scheduling columns to self_assessment_enrollments
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS user_timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS scheduled_datetime_utc TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS schedule_set_by VARCHAR(20) DEFAULT 'student', -- 'student' or 'mentor'
ADD COLUMN IF NOT EXISTS mentor_override_at TIMESTAMPTZ;

-- Create index for faster queries on scheduled datetime
CREATE INDEX IF NOT EXISTS idx_enrollments_scheduled_utc
ON self_assessment_enrollments(scheduled_datetime_utc);

-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_status
ON self_assessment_enrollments(status);

-- Function to convert local time to UTC based on timezone
CREATE OR REPLACE FUNCTION convert_to_utc(
    p_date DATE,
    p_time TIME,
    p_timezone VARCHAR
) RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN (p_date::TEXT || ' ' || p_time::TEXT)::TIMESTAMP AT TIME ZONE p_timezone;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update scheduled_datetime_utc when date/time/timezone changes
CREATE OR REPLACE FUNCTION update_scheduled_utc()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_time IS NOT NULL THEN
        NEW.scheduled_datetime_utc := convert_to_utc(
            NEW.scheduled_date,
            NEW.scheduled_time,
            COALESCE(NEW.user_timezone, 'America/Sao_Paulo')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_scheduled_utc ON self_assessment_enrollments;
CREATE TRIGGER trg_update_scheduled_utc
    BEFORE INSERT OR UPDATE ON self_assessment_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_utc();

-- View for Marcos to see all enrollments with Brasilia time
CREATE OR REPLACE VIEW self_assessment_enrollments_brasilia AS
SELECT
    e.*,
    u.name as student_name,
    u.email as student_email,
    u.whatsapp as student_whatsapp,
    sa.name as assessment_name,
    sa.total_questions,
    sa.questions_per_block,
    sa.time_per_block_minutes,
    -- Convert UTC to Brasilia time for display
    e.scheduled_datetime_utc AT TIME ZONE 'America/Sao_Paulo' as scheduled_datetime_brasilia,
    TO_CHAR(e.scheduled_datetime_utc AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') as scheduled_date_brasilia,
    TO_CHAR(e.scheduled_datetime_utc AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as scheduled_time_brasilia
FROM self_assessment_enrollments e
JOIN users u ON e.user_id = u.id
JOIN self_assessments sa ON e.self_assessment_id = sa.id;

-- Comment explaining the flow
COMMENT ON TABLE self_assessment_enrollments IS
'Self Assessment enrollments with scheduling support.
Students pick date/time in their timezone, stored in UTC.
Marcos can override for individual or all students.
When scheduled time arrives, the assessment timer starts automatically.
Late arrivals get time deducted from first block.';
