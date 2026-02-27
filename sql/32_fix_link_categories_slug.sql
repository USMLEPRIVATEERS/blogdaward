-- Fixed migration to add slug and created_by columns to link_categories
-- Handles duplicates and empty values properly

-- Step 1: Drop existing unique constraint and index if they exist
DROP INDEX IF EXISTS idx_link_categories_slug;
ALTER TABLE link_categories DROP CONSTRAINT IF EXISTS link_categories_slug_unique;

-- Step 2: Drop existing columns if they exist
ALTER TABLE link_categories DROP COLUMN IF EXISTS slug CASCADE;
ALTER TABLE link_categories DROP COLUMN IF EXISTS created_by CASCADE;

-- Step 3: Add slug and created_by columns
ALTER TABLE link_categories
ADD COLUMN slug VARCHAR(100);

ALTER TABLE link_categories
ADD COLUMN created_by BIGINT;

-- Step 4: Generate unique slugs for all existing categories
DO $$
DECLARE
    cat RECORD;
    new_slug TEXT;
    slug_counter INTEGER;
    slug_exists BOOLEAN;
BEGIN
    FOR cat IN SELECT id, name FROM link_categories LOOP
        -- Generate base slug from name
        new_slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    TRANSLATE(
                        cat.name,
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
        );

        -- Handle empty slugs
        IF new_slug = '' OR new_slug IS NULL THEN
            new_slug := 'category_' || cat.id;
        END IF;

        -- Check if slug already exists and make it unique if needed
        slug_counter := 1;
        LOOP
            SELECT EXISTS(
                SELECT 1 FROM link_categories
                WHERE slug = new_slug AND id != cat.id
            ) INTO slug_exists;

            EXIT WHEN NOT slug_exists;

            new_slug := LOWER(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        TRANSLATE(
                            cat.name,
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
            ) || '_' || slug_counter;

            slug_counter := slug_counter + 1;
        END LOOP;

        -- Update the category with the unique slug
        UPDATE link_categories SET slug = new_slug WHERE id = cat.id;
    END LOOP;
END $$;

-- Step 5: Make slug NOT NULL now that all rows have values
ALTER TABLE link_categories
ALTER COLUMN slug SET NOT NULL;

-- Step 6: Add unique constraint on slug
ALTER TABLE link_categories
ADD CONSTRAINT link_categories_slug_unique UNIQUE (slug);

-- Step 7: Add index for faster slug lookups
CREATE INDEX idx_link_categories_slug ON link_categories(slug);

-- Step 8: Add comments for documentation
COMMENT ON COLUMN link_categories.slug IS 'URL-safe unique identifier for the category';
COMMENT ON COLUMN link_categories.created_by IS 'User ID who created this custom category (NULL for system categories)';
