-- Add tags column to research_projects table
-- Tags like: congresso, publicado, arquivado
-- Run this in Supabase SQL Editor

ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN research_projects.tags IS 'Visual tags for project status: congresso, publicado, arquivado, etc.';
