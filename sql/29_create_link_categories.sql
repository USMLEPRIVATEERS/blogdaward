-- Create table for custom link categories
-- This allows users to create new categories that will be saved for future use

CREATE TABLE IF NOT EXISTS link_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_link_categories_slug ON link_categories(slug);

-- Add some comments for documentation
COMMENT ON TABLE link_categories IS 'Custom link categories created by users';
COMMENT ON COLUMN link_categories.slug IS 'URL-safe identifier for the category';
COMMENT ON COLUMN link_categories.name IS 'Display name of the category';
COMMENT ON COLUMN link_categories.created_by IS 'User who created this category';
