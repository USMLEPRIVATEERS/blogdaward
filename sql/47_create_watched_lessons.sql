-- Create watched_lessons table to track lessons that students have watched
-- This table stores the lesson identifier (course:lesson_name) along with the schedule_id for context

CREATE TABLE IF NOT EXISTS watched_lessons (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
    course_name VARCHAR(100) NOT NULL,      -- Ex: "B&B", "Sketchy", "Pathoma"
    lesson_name VARCHAR(255) NOT NULL,       -- Ex: "Videos 1-5", "Medical-Neuro"
    lesson_key VARCHAR(500) NOT NULL,        -- Unique key: "course_name:lesson_name" for easier lookups
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_watched_lessons_user_id ON watched_lessons(user_id);

-- Create index for fast lookups by schedule
CREATE INDEX IF NOT EXISTS idx_watched_lessons_schedule_id ON watched_lessons(schedule_id);

-- Create unique index to prevent duplicate entries (same user, same lesson)
CREATE UNIQUE INDEX IF NOT EXISTS idx_watched_lessons_unique ON watched_lessons(user_id, lesson_key);

-- Create index for lesson_key lookups
CREATE INDEX IF NOT EXISTS idx_watched_lessons_lesson_key ON watched_lessons(lesson_key);

-- Create index for recent watched lessons (for activity feed)
CREATE INDEX IF NOT EXISTS idx_watched_lessons_watched_at ON watched_lessons(watched_at DESC);

-- Disable RLS for this table (following the pattern of other tables in this project)
ALTER TABLE watched_lessons DISABLE ROW LEVEL SECURITY;

-- Comment on table
COMMENT ON TABLE watched_lessons IS 'Tracks which recommended lessons each student has marked as watched';
COMMENT ON COLUMN watched_lessons.lesson_key IS 'Unique identifier combining course_name and lesson_name for easy lookups';
