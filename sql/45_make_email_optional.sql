-- Make email optional in users table
-- This allows creating users without email (e.g., for members who don't have email yet)

-- Remove NOT NULL constraint from email
ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

-- Keep the UNIQUE constraint but allow NULL values
-- Note: PostgreSQL allows multiple NULL values in UNIQUE columns by default

-- Add a check to ensure at least one identifier exists
-- Either email OR full_name OR cpf must be present
ALTER TABLE users
ADD CONSTRAINT users_must_have_identifier
CHECK (
    email IS NOT NULL OR
    full_name IS NOT NULL OR
    cpf IS NOT NULL
);

COMMENT ON CONSTRAINT users_must_have_identifier ON users IS
'Ensures user has at least one form of identification: email, full_name, or cpf';
