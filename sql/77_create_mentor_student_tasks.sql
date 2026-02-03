-- Mentor student tasks / to-do tracking
-- Used by Guilherme's to-do list to track per-student milestones

CREATE TABLE IF NOT EXISTS mentor_student_tasks (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL, -- 'entry_date', 'first_call', 'fsrs_optimization', 'heatmap_photo', 'second_call'
    completed BOOLEAN DEFAULT FALSE,
    task_date DATE, -- date the task was done or is scheduled
    notes TEXT,
    dismissed BOOLEAN DEFAULT FALSE, -- for dismissing reminders
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by mentor
CREATE INDEX IF NOT EXISTS idx_mentor_student_tasks_mentor ON mentor_student_tasks(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_student_tasks_student ON mentor_student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_student_tasks_type ON mentor_student_tasks(task_type);

-- Unique constraint: one task per mentor/student/type combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_student_tasks_unique
    ON mentor_student_tasks(mentor_id, student_id, task_type);

-- Disable RLS (consistent with rest of app)
ALTER TABLE mentor_student_tasks DISABLE ROW LEVEL SECURITY;
