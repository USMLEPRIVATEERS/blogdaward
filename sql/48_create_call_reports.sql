-- Create call_reports table for storing call/meeting reports
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS call_reports (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landmark_id BIGINT REFERENCES landmarks(id) ON DELETE SET NULL,
    scheduled_call_id BIGINT REFERENCES scheduled_calls(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    call_date DATE NOT NULL,
    report_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_reports_student_id ON call_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_call_reports_mentor_id ON call_reports(mentor_id);
CREATE INDEX IF NOT EXISTS idx_call_reports_call_date ON call_reports(call_date);

-- Enable RLS
ALTER TABLE call_reports ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view reports
CREATE POLICY "Users can view call reports" ON call_reports
    FOR SELECT USING (true);

-- Policy: Mentors can insert reports
CREATE POLICY "Mentors can create reports" ON call_reports
    FOR INSERT WITH CHECK (true);

-- Policy: Mentors can update reports
CREATE POLICY "Mentors can update reports" ON call_reports
    FOR UPDATE USING (true);

-- Policy: Mentors can delete reports
CREATE POLICY "Mentors can delete reports" ON call_reports
    FOR DELETE USING (true);

COMMENT ON TABLE call_reports IS 'Reports from mentor calls/meetings with students';
