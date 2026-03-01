-- Fix: Add missing DELETE policy for blog_comments
-- Without this policy, users cannot delete comments via Supabase client

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'blog_comments' AND policyname = 'blog_comments_delete'
    ) THEN
        EXECUTE 'CREATE POLICY blog_comments_delete ON blog_comments FOR DELETE USING (true)';
    END IF;
END $$;
