-- Add wants_research_ward column to user_research_data table
-- This column tracks when students want to start research with Ward Academy

ALTER TABLE user_research_data
ADD COLUMN IF NOT EXISTS wants_research_ward VARCHAR(50) CHECK (wants_research_ward IN ('immediately', 'after_usmle', 'no'));

COMMENT ON COLUMN user_research_data.wants_research_ward IS 'When the student wants to start research: immediately, after_usmle, or no';
