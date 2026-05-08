-- Add sort_order column to schedules table to preserve spreadsheet ordering
-- When multiple categories share the same start_date, sort_order ensures
-- they display in the original order from the mentor's spreadsheet

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Backfill existing rows: set sort_order based on id order within each user
UPDATE schedules s
SET sort_order = sub.row_num
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY start_date, id) AS row_num
    FROM schedules
) sub
WHERE s.id = sub.id;
