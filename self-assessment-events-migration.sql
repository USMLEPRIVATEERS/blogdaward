-- ============================================
-- MIGRATION: Self Assessment Events
-- Run this in Supabase SQL Editor
-- ============================================

-- Create events table for scheduled self assessment events
CREATE TABLE IF NOT EXISTS self_assessment_events (
    id SERIAL PRIMARY KEY,
    self_assessment_id INTEGER NOT NULL REFERENCES self_assessments(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_datetime_utc TIMESTAMPTZ NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    UNIQUE(self_assessment_id, event_date, event_time)
);

-- Create index for active events lookup
CREATE INDEX IF NOT EXISTS idx_events_active
ON self_assessment_events(self_assessment_id, is_active)
WHERE is_active = true;

-- Create index for event date
CREATE INDEX IF NOT EXISTS idx_events_date
ON self_assessment_events(event_date);

-- Add column to enrollments to track if enrollment is from an event
ALTER TABLE self_assessment_enrollments
ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES self_assessment_events(id),
ADD COLUMN IF NOT EXISTS is_event_enrollment BOOLEAN DEFAULT false;

-- Function to get active event for a self assessment
CREATE OR REPLACE FUNCTION get_active_event(p_assessment_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    event_date DATE,
    event_time TIME,
    event_datetime_utc TIMESTAMPTZ,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.event_date,
        e.event_time,
        e.event_datetime_utc,
        e.is_active
    FROM self_assessment_events e
    WHERE e.self_assessment_id = p_assessment_id
      AND e.is_active = true
      AND e.event_date >= CURRENT_DATE
    ORDER BY e.event_date, e.event_time
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Verify table was created
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'self_assessment_events';
