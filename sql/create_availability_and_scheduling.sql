-- Create tables for mentor availability and call scheduling
-- Run this in Supabase SQL Editor

-- Table for mentor regular availability (recurring schedules)
CREATE TABLE IF NOT EXISTS mentor_availability_regular (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30, -- Duration of each slot
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for mentor specific availability (one-time slots)
CREATE TABLE IF NOT EXISTS mentor_availability_specific (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    is_unavailable BOOLEAN DEFAULT FALSE, -- TRUE = mentor is unavailable on this date
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for scheduled calls
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id BIGSERIAL PRIMARY KEY,
    landmark_id BIGINT REFERENCES landmarks(id) ON DELETE SET NULL,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mentor_id, scheduled_date, scheduled_time) -- Prevent double booking
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_regular_mentor ON mentor_availability_regular(mentor_id);
CREATE INDEX IF NOT EXISTS idx_availability_specific_mentor ON mentor_availability_specific(mentor_id, available_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_mentor ON scheduled_calls(mentor_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_student ON scheduled_calls(student_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_landmark ON scheduled_calls(landmark_id);

-- Enable RLS
ALTER TABLE mentor_availability_regular ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_availability_specific ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;

-- Policies for mentor_availability_regular
CREATE POLICY "Anyone can view availability" ON mentor_availability_regular
    FOR SELECT USING (true);
CREATE POLICY "Mentors can manage their availability" ON mentor_availability_regular
    FOR ALL USING (true);

-- Policies for mentor_availability_specific
CREATE POLICY "Anyone can view specific availability" ON mentor_availability_specific
    FOR SELECT USING (true);
CREATE POLICY "Mentors can manage specific availability" ON mentor_availability_specific
    FOR ALL USING (true);

-- Policies for scheduled_calls
CREATE POLICY "Anyone can view calls" ON scheduled_calls
    FOR SELECT USING (true);
CREATE POLICY "Anyone can manage calls" ON scheduled_calls
    FOR ALL USING (true);

COMMENT ON TABLE mentor_availability_regular IS 'Regular recurring availability for mentors (e.g., every Monday 9am-12pm)';
COMMENT ON TABLE mentor_availability_specific IS 'One-time availability or unavailability for specific dates';
COMMENT ON TABLE scheduled_calls IS 'Scheduled calls between students and mentors';
