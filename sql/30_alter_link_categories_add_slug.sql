-- Add slug and created_by columns to existing link_categories table
-- This enables the custom category creation feature

-- Add slug column (nullable initially)
ALTER TABLE link_categories
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add created_by column to track who created custom categories
-- Using BIGINT to match the id type in link_categories table
-- Not adding foreign key constraint due to type incompatibility with users.id (UUID)
ALTER TABLE link_categories
ADD COLUMN IF NOT EXISTS created_by BIGINT;

-- Generate slugs for existing categories from their names
-- Convert to lowercase, remove accents, replace spaces/special chars with underscores
UPDATE link_categories
SET slug = LOWER(
    REGEXP_REPLACE(
        TRANSLATE(
            name,
            'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇç',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
        ),
        '[^a-z0-9]+',
        '_',
        'g'
    )
)
WHERE slug IS NULL;

-- Remove leading/trailing underscores from generated slugs
UPDATE link_categories
SET slug = REGEXP_REPLACE(REGEXP_REPLACE(slug, '^_+', ''), '_+$', '')
WHERE slug IS NOT NULL;

-- Now make slug NOT NULL and UNIQUE
ALTER TABLE link_categories
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug
ALTER TABLE link_categories
ADD CONSTRAINT link_categories_slug_unique UNIQUE (slug);

-- Add index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_link_categories_slug ON link_categories(slug);

-- Add comments for documentation
COMMENT ON COLUMN link_categories.slug IS 'URL-safe identifier for the category (auto-generated from name or user-provided)';
COMMENT ON COLUMN link_categories.created_by IS 'User who created this custom category (NULL for system categories)';
