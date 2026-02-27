-- Add new columns to research_projects table
-- Run this in Supabase SQL Editor

-- Add project_type column
ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) DEFAULT 'double-arm';

-- Add deadline column
ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add drive_link column
ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS drive_link TEXT;

COMMENT ON COLUMN research_projects.project_type IS 'Type of meta-analysis: double-arm, single-arm, or network';
COMMENT ON COLUMN research_projects.deadline IS 'Project deadline';
COMMENT ON COLUMN research_projects.drive_link IS 'Link to Google Drive folder';
