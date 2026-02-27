-- Mentor student tasks / to-do tracking
-- Used by Guilherme's to-do list to track per-student milestones
-- NO foreign keys to avoid type mismatch issues

DROP TABLE IF EXISTS mentor_student_tasks;

CREATE TABLE mentor_student_tasks (
    id BIGSERIAL PRIMARY KEY,
    mentor_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_date DATE,
    notes TEXT,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mentor_student_tasks_mentor ON mentor_student_tasks(mentor_id);
CREATE INDEX idx_mentor_student_tasks_student ON mentor_student_tasks(student_id);
CREATE INDEX idx_mentor_student_tasks_type ON mentor_student_tasks(task_type);

CREATE UNIQUE INDEX idx_mentor_student_tasks_unique
    ON mentor_student_tasks(mentor_id, student_id, task_type);

ALTER TABLE mentor_student_tasks DISABLE ROW LEVEL SECURITY;
