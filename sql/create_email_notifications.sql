-- =====================================================
-- EMAIL NOTIFICATIONS SYSTEM FOR SCHEDULED CALLS
-- =====================================================
-- This creates a complete email notification system that sends:
-- 1. Immediate email when call is scheduled
-- 2. Reminder 24 hours before
-- 3. Reminder 12 hours before

-- Table to track scheduled email notifications
CREATE TABLE IF NOT EXISTS scheduled_emails (
    id BIGSERIAL PRIMARY KEY,
    scheduled_call_id BIGINT NOT NULL REFERENCES scheduled_calls(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- 'mentor' or 'student'
    email_type VARCHAR(20) NOT NULL, -- 'immediate', '24h_before', '12h_before'
    send_at TIMESTAMPTZ NOT NULL, -- When to send this email
    sent_at TIMESTAMPTZ, -- When it was actually sent (NULL = pending)
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying of pending emails
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending
ON scheduled_emails(send_at, status)
WHERE status = 'pending';

-- Index for call ID lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_call_id
ON scheduled_emails(scheduled_call_id);

-- =====================================================
-- FUNCTION: Create email notifications when call is scheduled
-- =====================================================
CREATE OR REPLACE FUNCTION schedule_call_email_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_student_email VARCHAR(255);
    v_student_name VARCHAR(255);
    v_mentor_email VARCHAR(255);
    v_mentor_name VARCHAR(255);
    v_call_datetime TIMESTAMPTZ;
    v_24h_before TIMESTAMPTZ;
    v_12h_before TIMESTAMPTZ;
BEGIN
    -- Get student info
    SELECT email, full_name INTO v_student_email, v_student_name
    FROM users WHERE id = NEW.student_id;

    -- Get mentor info
    SELECT email, full_name INTO v_mentor_email, v_mentor_name
    FROM users WHERE id = NEW.mentor_id;

    -- Calculate datetimes
    v_call_datetime := (NEW.scheduled_date + NEW.scheduled_time::TIME);
    v_24h_before := v_call_datetime - INTERVAL '24 hours';
    v_12h_before := v_call_datetime - INTERVAL '12 hours';

    -- ========== MENTOR EMAILS ==========

    -- 1. Immediate email to mentor
    INSERT INTO scheduled_emails (
        scheduled_call_id, recipient_email, recipient_type,
        email_type, send_at, status
    ) VALUES (
        NEW.id, v_mentor_email, 'mentor',
        'immediate', NOW(), 'pending'
    );

    -- 2. 24h before reminder to mentor
    IF v_24h_before > NOW() THEN
        INSERT INTO scheduled_emails (
            scheduled_call_id, recipient_email, recipient_type,
            email_type, send_at, status
        ) VALUES (
            NEW.id, v_mentor_email, 'mentor',
            '24h_before', v_24h_before, 'pending'
        );
    END IF;

    -- 3. 12h before reminder to mentor
    IF v_12h_before > NOW() THEN
        INSERT INTO scheduled_emails (
            scheduled_call_id, recipient_email, recipient_type,
            email_type, send_at, status
        ) VALUES (
            NEW.id, v_mentor_email, 'mentor',
            '12h_before', v_12h_before, 'pending'
        );
    END IF;

    -- ========== STUDENT EMAILS ==========

    -- 1. Immediate email to student
    INSERT INTO scheduled_emails (
        scheduled_call_id, recipient_email, recipient_type,
        email_type, send_at, status
    ) VALUES (
        NEW.id, v_student_email, 'student',
        'immediate', NOW(), 'pending'
    );

    -- 2. 24h before reminder to student
    IF v_24h_before > NOW() THEN
        INSERT INTO scheduled_emails (
            scheduled_call_id, recipient_email, recipient_type,
            email_type, send_at, status
        ) VALUES (
            NEW.id, v_student_email, 'student',
            '24h_before', v_24h_before, 'pending'
        );
    END IF;

    -- 3. 12h before reminder to student
    IF v_12h_before > NOW() THEN
        INSERT INTO scheduled_emails (
            scheduled_call_id, recipient_email, recipient_type,
            email_type, send_at, status
        ) VALUES (
            NEW.id, v_student_email, 'student',
            '12h_before', v_12h_before, 'pending'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-schedule emails when call is created
-- =====================================================
DROP TRIGGER IF EXISTS trigger_schedule_call_emails ON scheduled_calls;

CREATE TRIGGER trigger_schedule_call_emails
    AFTER INSERT ON scheduled_calls
    FOR EACH ROW
    EXECUTE FUNCTION schedule_call_email_notifications();

-- =====================================================
-- FUNCTION: Get pending emails ready to send
-- =====================================================
CREATE OR REPLACE FUNCTION get_pending_emails()
RETURNS TABLE (
    email_id BIGINT,
    call_id BIGINT,
    recipient_email VARCHAR,
    recipient_type VARCHAR,
    email_type VARCHAR,
    student_id BIGINT,
    student_name VARCHAR,
    student_email VARCHAR,
    student_whatsapp VARCHAR,
    mentor_id BIGINT,
    mentor_name VARCHAR,
    mentor_email VARCHAR,
    mentor_whatsapp VARCHAR,
    scheduled_date DATE,
    scheduled_time TIME,
    call_notes TEXT,
    landmark_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        se.id as email_id,
        sc.id as call_id,
        se.recipient_email,
        se.recipient_type,
        se.email_type,
        sc.student_id,
        s.full_name as student_name,
        s.email as student_email,
        s.phone as student_whatsapp,
        sc.mentor_id,
        m.full_name as mentor_name,
        m.email as mentor_email,
        m.phone as mentor_whatsapp,
        sc.scheduled_date,
        sc.scheduled_time,
        sc.notes as call_notes,
        l.title as landmark_title
    FROM scheduled_emails se
    JOIN scheduled_calls sc ON se.scheduled_call_id = sc.id
    JOIN users s ON sc.student_id = s.id
    JOIN users m ON sc.mentor_id = m.id
    LEFT JOIN landmarks l ON sc.landmark_id = l.id
    WHERE se.status = 'pending'
      AND se.send_at <= NOW()
    ORDER BY se.send_at ASC
    LIMIT 100; -- Process in batches
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Mark email as sent
-- =====================================================
CREATE OR REPLACE FUNCTION mark_email_sent(p_email_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE scheduled_emails
    SET status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Mark email as failed
-- =====================================================
CREATE OR REPLACE FUNCTION mark_email_failed(p_email_id BIGINT, p_error_message TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE scheduled_emails
    SET status = 'failed',
        error_message = p_error_message,
        updated_at = NOW()
    WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON scheduled_emails TO authenticated;
GRANT USAGE ON SEQUENCE scheduled_emails_id_seq TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE scheduled_emails IS 'Tracks all scheduled email notifications for calls';
COMMENT ON COLUMN scheduled_emails.recipient_type IS 'Either mentor or student';
COMMENT ON COLUMN scheduled_emails.email_type IS 'immediate, 24h_before, or 12h_before';
COMMENT ON COLUMN scheduled_emails.send_at IS 'When this email should be sent';
COMMENT ON COLUMN scheduled_emails.sent_at IS 'When email was actually sent (NULL = not sent yet)';
