-- Add recommended_lessons column to schedules table
-- This column will store recommended video lessons for each category

ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS recommended_lessons TEXT;

-- Add comment for documentation
COMMENT ON COLUMN schedules.recommended_lessons IS 'Recommended video lessons (e.g., B&B, Sketchy) for this category';
