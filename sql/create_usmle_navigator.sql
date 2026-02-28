-- USMLE Navigator - Tables for Supabase
-- Stores student bookmarks, read status, doubts, and notes from the USMLE Navigator tool

-- Main table: stores all user interactions with navigator resources
CREATE TABLE IF NOT EXISTS usmle_navigator_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL, -- maps to the D[] array id in the navigator
    is_bookmarked BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    has_doubt BOOLEAN DEFAULT FALSE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_usmle_nav_user ON usmle_navigator_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_usmle_nav_bookmarked ON usmle_navigator_progress(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_usmle_nav_doubt ON usmle_navigator_progress(user_id, has_doubt) WHERE has_doubt = TRUE;
CREATE INDEX IF NOT EXISTS idx_usmle_nav_read ON usmle_navigator_progress(user_id, is_read) WHERE is_read = TRUE;

-- Activity log: records each action for the global activity feed
CREATE TABLE IF NOT EXISTS usmle_navigator_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL,
    resource_title TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('bookmark', 'unbookmark', 'read', 'unread', 'doubt', 'undoubt', 'note')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usmle_nav_activity_user ON usmle_navigator_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_usmle_nav_activity_date ON usmle_navigator_activity(created_at DESC);

-- Disable RLS (consistent with the rest of the app)
ALTER TABLE usmle_navigator_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE usmle_navigator_activity ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own data, mentors can read all
CREATE POLICY "Users can manage own navigator progress"
    ON usmle_navigator_progress FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can manage own navigator activity"
    ON usmle_navigator_activity FOR ALL
    USING (true)
    WITH CHECK (true);
