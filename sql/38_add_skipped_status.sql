-- Add 'skipped' to the allowed status values in daily_checkins table

-- Drop the old constraint
ALTER TABLE daily_checkins
DROP CONSTRAINT IF EXISTS daily_checkins_status_check;

-- Add new constraint with 'skipped' included
ALTER TABLE daily_checkins
ADD CONSTRAINT daily_checkins_status_check
CHECK (status IN ('tranquilo', 'preciso_ajuda', 'parado', 'custom', 'skipped') OR status IS NULL);

-- Comment
COMMENT ON CONSTRAINT daily_checkins_status_check ON daily_checkins IS 'Allows: tranquilo, preciso_ajuda, parado, custom, skipped, or NULL';
