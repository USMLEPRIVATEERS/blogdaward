-- Mark all "Entrada na Ward Academy" landmarks as completed
-- This is the initial landmark that should be completed by default
-- Run this in Supabase SQL Editor

UPDATE landmarks
SET
    completed = TRUE,
    completion_date = COALESCE(completion_date, created_at),
    updated_at = NOW()
WHERE
    title = 'Entrada na Ward Academy'
    AND completed = FALSE;

-- Show how many were updated
SELECT COUNT(*) as updated_count
FROM landmarks
WHERE title = 'Entrada na Ward Academy' AND completed = TRUE;
