-- ============================================
-- GOOGLE DRIVE INTEGRATION FOR RESEARCH PROJECTS
-- Creates tables to store folder structure and files
-- ============================================

-- Table to store Google Drive folder structure for each project
CREATE TABLE IF NOT EXISTS research_project_folders (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    folder_id VARCHAR(255) NOT NULL, -- Google Drive folder ID
    parent_folder_name VARCHAR(255), -- NULL for root project folder
    folder_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, folder_name, parent_folder_name)
);

-- Table to track files uploaded to project folders
CREATE TABLE IF NOT EXISTS research_project_files (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    folder_id BIGINT NOT NULL REFERENCES research_project_folders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_id VARCHAR(255) NOT NULL, -- Google Drive file ID
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by BIGINT REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_folders_project
ON research_project_folders(project_id);

CREATE INDEX IF NOT EXISTS idx_project_files_project
ON research_project_files(project_id);

CREATE INDEX IF NOT EXISTS idx_project_files_folder
ON research_project_files(folder_id);

-- Comments
COMMENT ON TABLE research_project_folders IS 'Stores Google Drive folder structure for research projects';
COMMENT ON TABLE research_project_files IS 'Tracks files uploaded to research project folders in Google Drive';
COMMENT ON COLUMN research_project_folders.folder_id IS 'Google Drive folder ID';
COMMENT ON COLUMN research_project_folders.parent_folder_name IS 'NULL for project root folder, otherwise parent folder name';
COMMENT ON COLUMN research_project_files.file_id IS 'Google Drive file ID for deletion/management';
