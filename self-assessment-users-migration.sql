-- ============================================
-- MIGRATION: Prepare users table for external Self Assessment users
-- Run this BEFORE using the Self Assessment feature
-- ============================================

-- Add whatsapp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'whatsapp') THEN
        ALTER TABLE users ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

-- Update role constraint to include 'externo'
-- First drop the existing constraint, then add the new one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
    (role)::text = ANY (
        ARRAY[
            ('aluno'::character varying)::text,
            ('assessoria'::character varying)::text,
            ('mentor_marcos'::character varying)::text,
            ('mentor_iria'::character varying)::text,
            ('mentor_guilherme'::character varying)::text,
            ('mentor_fernando'::character varying)::text,
            ('externo'::character varying)::text
        ]
    )
);
