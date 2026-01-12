-- ========================================
-- USMLE PRIVATEERS - Wiki Schema
-- Folder structure like Ward Academy courses
-- ========================================

-- ========================================
-- WIKI FOLDERS TABLE
-- Hierarchical folder structure
-- ========================================
CREATE TABLE wiki_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES wiki_folders(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon class

    -- Ordering
    order_position INTEGER DEFAULT 0,

    -- Metadata
    is_published BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Full path for quick lookups (e.g., "STEP_1::CARDIOLOGY::HEART_FAILURE")
    full_path TEXT
);

CREATE INDEX idx_wiki_folders_parent ON wiki_folders(parent_id);
CREATE INDEX idx_wiki_folders_slug ON wiki_folders(slug);
CREATE INDEX idx_wiki_folders_path ON wiki_folders(full_path);
CREATE INDEX idx_wiki_folders_order ON wiki_folders(parent_id, order_position);

-- ========================================
-- WIKI ARTICLES TABLE
-- Content inside folders
-- ========================================
CREATE TABLE wiki_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID REFERENCES wiki_folders(id) ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    summary TEXT, -- Short description for listings

    -- Rich content
    featured_image TEXT,
    attachments JSONB, -- Array of {url, name, type}

    -- Ordering
    order_position INTEGER DEFAULT 0,

    -- Metadata
    is_published BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,

    -- Author info
    created_by UUID REFERENCES users(id),
    last_edited_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wiki_articles_folder ON wiki_articles(folder_id);
CREATE INDEX idx_wiki_articles_slug ON wiki_articles(slug);
CREATE INDEX idx_wiki_articles_published ON wiki_articles(is_published);
CREATE INDEX idx_wiki_articles_order ON wiki_articles(folder_id, order_position);

-- ========================================
-- WIKI ARTICLE HISTORY
-- Track edits for version control
-- ========================================
CREATE TABLE wiki_article_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES wiki_articles(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    edited_by UUID REFERENCES users(id),
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Change description
    change_summary TEXT
);

CREATE INDEX idx_wiki_history_article ON wiki_article_history(article_id);
CREATE INDEX idx_wiki_history_date ON wiki_article_history(edited_at DESC);

-- ========================================
-- WIKI BOOKMARKS
-- User's saved articles
-- ========================================
CREATE TABLE wiki_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES wiki_articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, article_id)
);

CREATE INDEX idx_wiki_bookmarks_user ON wiki_bookmarks(user_id);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update full_path when folder changes
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.full_path = NEW.slug;
    ELSE
        SELECT full_path INTO parent_path FROM wiki_folders WHERE id = NEW.parent_id;
        NEW.full_path = parent_path || '::' || NEW.slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folder_path
    BEFORE INSERT OR UPDATE OF parent_id, slug ON wiki_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_path();

-- Update children paths when parent changes
CREATE OR REPLACE FUNCTION update_children_paths()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.full_path IS DISTINCT FROM NEW.full_path THEN
        UPDATE wiki_folders
        SET full_path = NEW.full_path || SUBSTRING(full_path FROM LENGTH(OLD.full_path) + 1)
        WHERE full_path LIKE OLD.full_path || '::%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_children_paths
    AFTER UPDATE OF full_path ON wiki_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_children_paths();

-- Save article history on update
CREATE OR REPLACE FUNCTION save_article_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
        INSERT INTO wiki_article_history (article_id, title, content, edited_by)
        VALUES (OLD.id, OLD.title, OLD.content, NEW.last_edited_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_save_article_history
    BEFORE UPDATE ON wiki_articles
    FOR EACH ROW
    EXECUTE FUNCTION save_article_history();

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_article_views(article_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE wiki_articles
    SET views_count = views_count + 1
    WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DEFAULT WIKI STRUCTURE
-- ========================================

-- Root folders
INSERT INTO wiki_folders (name, slug, icon, order_position, full_path) VALUES
('Comece Aqui', 'comece-aqui', '🚀', 1, 'comece-aqui'),
('ECFMG', 'ecfmg', '📋', 2, 'ecfmg'),
('Step 1', 'step1', '📚', 3, 'step1'),
('Step 2 CK', 'step2ck', '📖', 4, 'step2ck'),
('Step 3', 'step3', '🎓', 5, 'step3'),
('OET', 'oet', '🗣️', 6, 'oet'),
('Observership', 'observership', '👨‍⚕️', 7, 'observership'),
('Research', 'research', '🔬', 8, 'research'),
('Match', 'match', '🏆', 9, 'match'),
('Recursos', 'recursos', '🛠️', 10, 'recursos'),
('FAQ', 'faq', '❓', 11, 'faq');

-- Subfolders for Comece Aqui
INSERT INTO wiki_folders (parent_id, name, slug, icon, order_position)
SELECT id, 'O que é o USMLE?', 'o-que-e-usmle', '📌', 1 FROM wiki_folders WHERE slug = 'comece-aqui'
UNION ALL
SELECT id, 'Pathway e Eligibility', 'pathway-eligibility', '🛤️', 2 FROM wiki_folders WHERE slug = 'comece-aqui'
UNION ALL
SELECT id, 'Timeline Sugerida', 'timeline-sugerida', '📅', 3 FROM wiki_folders WHERE slug = 'comece-aqui'
UNION ALL
SELECT id, 'Custos Estimados', 'custos-estimados', '💰', 4 FROM wiki_folders WHERE slug = 'comece-aqui';

-- Subfolders for Step 1
INSERT INTO wiki_folders (parent_id, name, slug, icon, order_position)
SELECT id, 'Materiais de Estudo', 'materiais-estudo', '📕', 1 FROM wiki_folders WHERE slug = 'step1'
UNION ALL
SELECT id, 'Cronograma de Estudos', 'cronograma-estudos', '📆', 2 FROM wiki_folders WHERE slug = 'step1'
UNION ALL
SELECT id, 'Anki Decks', 'anki-decks', '🃏', 3 FROM wiki_folders WHERE slug = 'step1'
UNION ALL
SELECT id, 'Dicas de Prova', 'dicas-prova', '💡', 4 FROM wiki_folders WHERE slug = 'step1'
UNION ALL
SELECT id, 'Relatos de Aprovados', 'relatos-aprovados', '🏅', 5 FROM wiki_folders WHERE slug = 'step1';

-- Subfolders for Recursos
INSERT INTO wiki_folders (parent_id, name, slug, icon, order_position)
SELECT id, 'UWorld', 'uworld', '🌍', 1 FROM wiki_folders WHERE slug = 'recursos'
UNION ALL
SELECT id, 'Amboss', 'amboss', '🔍', 2 FROM wiki_folders WHERE slug = 'recursos'
UNION ALL
SELECT id, 'Boards & Beyond', 'boards-beyond', '📺', 3 FROM wiki_folders WHERE slug = 'recursos'
UNION ALL
SELECT id, 'First Aid', 'first-aid', '🩹', 4 FROM wiki_folders WHERE slug = 'recursos'
UNION ALL
SELECT id, 'Pathoma', 'pathoma', '🔬', 5 FROM wiki_folders WHERE slug = 'recursos'
UNION ALL
SELECT id, 'Sketchy', 'sketchy', '✏️', 6 FROM wiki_folders WHERE slug = 'recursos';

-- ========================================
-- VIEWS
-- ========================================

-- Folder tree view with article counts
CREATE VIEW wiki_folder_tree AS
WITH RECURSIVE folder_tree AS (
    -- Root folders
    SELECT
        f.id,
        f.parent_id,
        f.name,
        f.slug,
        f.full_path,
        f.icon,
        f.order_position,
        f.is_published,
        0 as depth
    FROM wiki_folders f
    WHERE f.parent_id IS NULL

    UNION ALL

    -- Child folders
    SELECT
        f.id,
        f.parent_id,
        f.name,
        f.slug,
        f.full_path,
        f.icon,
        f.order_position,
        f.is_published,
        ft.depth + 1
    FROM wiki_folders f
    JOIN folder_tree ft ON f.parent_id = ft.id
)
SELECT
    ft.*,
    (SELECT COUNT(*) FROM wiki_articles a WHERE a.folder_id = ft.id AND a.is_published = TRUE) as article_count,
    (SELECT COUNT(*) FROM wiki_folders wf WHERE wf.parent_id = ft.id) as subfolder_count
FROM folder_tree ft
ORDER BY ft.depth, ft.order_position;

-- Recent articles view
CREATE VIEW recent_wiki_articles AS
SELECT
    a.*,
    f.name as folder_name,
    f.full_path as folder_path,
    u.full_name as author_name
FROM wiki_articles a
JOIN wiki_folders f ON a.folder_id = f.id
JOIN users u ON a.created_by = u.id
WHERE a.is_published = TRUE
ORDER BY a.updated_at DESC
LIMIT 20;

-- Popular articles view
CREATE VIEW popular_wiki_articles AS
SELECT
    a.*,
    f.name as folder_name,
    f.full_path as folder_path
FROM wiki_articles a
JOIN wiki_folders f ON a.folder_id = f.id
WHERE a.is_published = TRUE
ORDER BY a.views_count DESC
LIMIT 20;
