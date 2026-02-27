-- Fix course_videos and course_audios where is_published is NULL or string 'false'/'true'
-- Ensures all boolean fields are actual booleans

-- Fix is_published
UPDATE course_videos SET is_published = true WHERE is_published IS NULL;
UPDATE course_videos SET is_published = true WHERE is_published::text = 'true';
UPDATE course_videos SET is_published = false WHERE is_published::text = 'false';

-- Fix is_hidden (string 'false' was being treated as truthy in JS, hiding lessons)
UPDATE course_videos SET is_hidden = false WHERE is_hidden IS NULL;
UPDATE course_videos SET is_hidden = true WHERE is_hidden::text = 'true';
UPDATE course_videos SET is_hidden = false WHERE is_hidden::text = 'false';

-- Same for course_audios
UPDATE course_audios SET is_published = true WHERE is_published IS NULL;
UPDATE course_audios SET is_hidden = false WHERE is_hidden IS NULL;
