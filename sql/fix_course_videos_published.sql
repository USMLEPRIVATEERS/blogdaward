-- Fix course_videos and course_audios where is_published is NULL
-- Sets them to true so they appear in the course listing

UPDATE course_videos SET is_published = true WHERE is_published IS NULL;
UPDATE course_audios SET is_published = true WHERE is_published IS NULL;
