-- Modify daily_checkins table to support new NULL-based logic
-- NULL = not filled yet (show modal)
-- 0 or data = filled (don't show modal)

-- Add column to track if check-in was skipped (0 = skipped, 1 = filled)
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS filled SMALLINT DEFAULT NULL;

-- Update existing records
-- If status is 'skipped', set filled = 0
-- If status has any other value, set filled = 1
UPDATE daily_checkins
SET filled = CASE
    WHEN status = 'skipped' THEN 0
    WHEN status IS NOT NULL THEN 1
    ELSE NULL
END
WHERE filled IS NULL;

-- Make status column nullable (if not already)
ALTER TABLE daily_checkins
ALTER COLUMN status DROP NOT NULL;

-- Make message column nullable (if not already)
ALTER TABLE daily_checkins
ALTER COLUMN message DROP NOT NULL;

-- Add index on filled column for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_checkins_filled ON daily_checkins(user_id, date, filled);

-- Comment
COMMENT ON COLUMN daily_checkins.filled IS 'NULL = not filled yet (show modal), 0 = skipped/closed, 1 = filled with data';
