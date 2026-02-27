-- Kanban System Tables
-- Allows users to organize projects and tasks in a kanban board

-- Projects table
CREATE TABLE IF NOT EXISTS kanban_projects (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    -- Status: 'todo', 'doing', 'done', 'archived'
    position INTEGER NOT NULL DEFAULT 0,
    -- Position within the column for ordering
    archived_at TIMESTAMP WITH TIME ZONE,
    -- When the project was moved to archived status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('todo', 'doing', 'done', 'archived'))
);

-- Tasks table (subtasks within a project)
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES kanban_projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table (files attached to projects or tasks)
CREATE TABLE IF NOT EXISTS kanban_files (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES kanban_projects(id) ON DELETE CASCADE,
    task_id BIGINT REFERENCES kanban_tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Either project_id or task_id must be set (not both)
    CONSTRAINT file_belongs_to_one CHECK (
        (project_id IS NOT NULL AND task_id IS NULL) OR
        (project_id IS NULL AND task_id IS NOT NULL)
    )
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kanban_projects_user ON kanban_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_projects_status ON kanban_projects(status);
CREATE INDEX IF NOT EXISTS idx_kanban_projects_archived ON kanban_projects(archived_at)
    WHERE status = 'archived';
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_files_project ON kanban_files(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_files_task ON kanban_files(task_id);

-- Trigger to set archived_at when status changes to archived
CREATE OR REPLACE FUNCTION update_archived_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
        NEW.archived_at = NOW();
    ELSIF NEW.status != 'archived' THEN
        NEW.archived_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_archived_at
    BEFORE UPDATE ON kanban_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_archived_at();

-- Triggers for updated_at
CREATE TRIGGER update_kanban_projects_updated_at
    BEFORE UPDATE ON kanban_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-delete archived projects older than 1 month
CREATE OR REPLACE FUNCTION delete_old_archived_projects()
RETURNS void AS $$
BEGIN
    DELETE FROM kanban_projects
    WHERE status = 'archived'
    AND archived_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE kanban_projects IS 'Kanban projects for user task management';
COMMENT ON TABLE kanban_tasks IS 'Tasks/subtasks within kanban projects';
COMMENT ON TABLE kanban_files IS 'Files attached to projects or tasks';
COMMENT ON COLUMN kanban_projects.status IS 'Project status: todo, doing, done, or archived';
COMMENT ON COLUMN kanban_projects.position IS 'Order position within the status column';
COMMENT ON COLUMN kanban_projects.archived_at IS 'Timestamp when project was archived (for auto-deletion after 1 month)';
COMMENT ON FUNCTION delete_old_archived_projects IS 'Deletes archived projects older than 1 month to save space';
