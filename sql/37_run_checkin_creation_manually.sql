-- Manual execution: Create check-in entries for today
-- Run this ONCE to create entries for all students for today
-- After this, the cron job will handle it automatically at 3 AM daily

SELECT create_daily_checkin_entries();

-- Verify entries were created
SELECT
    dc.date,
    u.full_name,
    u.email,
    dc.filled,
    dc.status,
    dc.message
FROM daily_checkins dc
JOIN users u ON dc.user_id = u.id
WHERE dc.date = CURRENT_DATE
ORDER BY u.full_name;
