-- Clean migration to add slug and created_by columns to link_categories
-- Handles existing constraints and columns safely

-- Step 1: Drop any problematic foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'link_categories_created_by_fkey'
        AND table_name = 'link_categories'
    ) THEN
        ALTER TABLE link_categories DROP CONSTRAINT link_categories_created_by_fkey;
    END IF;
END $$;

-- Step 2: Drop existing columns if they exist (to start fresh)
ALTER TABLE link_categories DROP COLUMN IF EXISTS slug;
ALTER TABLE link_categories DROP COLUMN IF EXISTS created_by;

-- Step 3: Add slug column
ALTER TABLE link_categories
ADD COLUMN slug VARCHAR(100);

-- Step 4: Add created_by column (BIGINT, no foreign key)
ALTER TABLE link_categories
ADD COLUMN created_by BIGINT;

-- Step 5: Generate slugs for existing categories from their names
UPDATE link_categories
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            TRANSLATE(
                name,
                'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇç',
                'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
            ),
            '[^a-z0-9]+',
            '_',
            'g'
        ),
        '(^_+|_+$)',
        '',
        'g'
    )
)
WHERE slug IS NULL;

-- Step 6: Make slug NOT NULL after populating
ALTER TABLE link_categories
ALTER COLUMN slug SET NOT NULL;

-- Step 7: Add unique constraint on slug
ALTER TABLE link_categories
ADD CONSTRAINT link_categories_slug_unique UNIQUE (slug);

-- Step 8: Add index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_link_categories_slug ON link_categories(slug);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN link_categories.slug IS 'URL-safe identifier for the category (auto-generated from name or user-provided)';
COMMENT ON COLUMN link_categories.created_by IS 'User ID who created this custom category (NULL for system categories, no FK constraint due to type mismatch)';
