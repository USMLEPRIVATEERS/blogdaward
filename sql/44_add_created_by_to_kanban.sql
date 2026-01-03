-- Add created_by field to track who created the project
-- This helps identify when a mentor creates a project for a student

ALTER TABLE kanban_projects
ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_kanban_projects_created_by ON kanban_projects(created_by);

-- Comment
COMMENT ON COLUMN kanban_projects.created_by IS 'ID of the user who created this project (may be different from user_id if a mentor created it for a student)';
