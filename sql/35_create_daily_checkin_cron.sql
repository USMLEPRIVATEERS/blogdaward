-- Create function to generate daily check-in entries for all students
-- This function will be called by a cron job every day at 3 AM

CREATE OR REPLACE FUNCTION create_daily_checkin_entries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create check-in entries for all active students (role = 'aluno')
    -- Only create if entry doesn't already exist for today
    INSERT INTO daily_checkins (user_id, date, status, message, uworld_questions_done, uworld_correct_answers, anki_cards_today, anki_avg_cards, anki_current_streak, created_at)
    SELECT
        id as user_id,
        CURRENT_DATE as date,
        NULL as status,  -- NULL means not filled yet
        NULL as message,
        NULL as uworld_questions_done,
        NULL as uworld_correct_answers,
        NULL as anki_cards_today,
        NULL as anki_avg_cards,
        NULL as anki_current_streak,
        NOW() as created_at
    FROM users
    WHERE role = 'aluno'
    AND NOT EXISTS (
        SELECT 1
        FROM daily_checkins
        WHERE daily_checkins.user_id = users.id
        AND daily_checkins.date = CURRENT_DATE
    );

    RAISE NOTICE 'Daily check-in entries created successfully for %', CURRENT_DATE;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION create_daily_checkin_entries() IS 'Creates daily check-in entries for all students. Called by cron job at 3 AM daily.';

-- To manually test the function:
-- SELECT create_daily_checkin_entries();

-- IMPORTANT: To schedule this function to run daily at 3 AM, you need to:
-- 1. Use pg_cron extension (if available in Supabase)
-- 2. Or set up external cron job that calls this function via API
-- 3. Or use Supabase Edge Functions with scheduled triggers

-- Example using pg_cron (if available):
-- SELECT cron.schedule(
--     'create-daily-checkins',
--     '0 3 * * *',  -- Every day at 3 AM
--     'SELECT create_daily_checkin_entries();'
-- );
