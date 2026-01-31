-- Fix RLS policies for course_video_comments

-- Allow authenticated users to read all comments
CREATE POLICY "Anyone can read comments" ON course_video_comments
    FOR SELECT TO authenticated
    USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Users can insert comments" ON course_video_comments
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow users to delete their own comments, and mentors (marcos/iria) to delete any
CREATE POLICY "Users can delete own comments or mentors delete any" ON course_video_comments
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::uuid
            AND users.role IN ('mentor_marcos', 'mentor_iria')
        )
    );
