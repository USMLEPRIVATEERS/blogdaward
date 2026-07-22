-- Add 'assessoria' to the allowed roles in users table

-- Drop existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with 'assessoria' included
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (
  (role)::text = ANY (
    ARRAY[
      'aluno'::character varying,
      'assessoria'::character varying,
      'mentor_marcos'::character varying,
      'mentor_iria'::character varying,
      'mentor_guilherme'::character varying,
      'mentor_fernando'::character varying
    ]::text[]
  )
);

-- Verify constraint was updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_check';
