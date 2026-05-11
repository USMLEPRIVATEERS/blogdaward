-- =============================================
-- Replace mentor_romulo with mentor_fernando
-- Romulo is no longer at Ward Academy.
-- Dr. Fernando Vasconcellos is now responsible for research.
-- Students get only 1 call with Fernando, after passing Step 1.
-- =============================================

-- 1. Drop the existing CHECK constraint on users.role and recreate with mentor_fernando
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'aluno',
        'assessoria',
        'externo',
        'mentor_marcos',
        'mentor_iria',
        'mentor_guilherme',
        'mentor_fernando',
        'mentor_romulo',  -- kept temporarily for safe migration; can be removed after verification
        'mentor',
        'admin'
    ));

-- 2. Migrate existing user records
UPDATE users
SET role = 'mentor_fernando',
    full_name = CASE
        WHEN full_name ILIKE '%Romulo%' OR full_name ILIKE '%Rômulo%' THEN 'Fernando Vasconcellos'
        ELSE full_name
    END
WHERE role = 'mentor_romulo';

-- 3. Migrate landmark types from call_romulo* to call_fernando*
UPDATE landmarks
SET landmark_type = REPLACE(landmark_type, 'romulo', 'fernando')
WHERE landmark_type ILIKE '%romulo%';

-- 4. Update landmark titles that mention Romulo
UPDATE landmarks
SET title = REPLACE(REPLACE(title, 'Rômulo', 'Fernando Vasconcellos'), 'Romulo', 'Fernando Vasconcellos')
WHERE title ILIKE '%romulo%' OR title ILIKE '%rômulo%';

-- 5. Update landmark_types reference table if it exists
-- Actual columns: code, name, description, mentor_role, icon, color
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'landmark_types') THEN
        UPDATE landmark_types
        SET code = REPLACE(code, 'romulo', 'fernando'),
            name = REPLACE(REPLACE(name, 'Rômulo', 'Fernando Vasconcellos'), 'Romulo', 'Fernando Vasconcellos'),
            description = REPLACE(REPLACE(description, 'Rômulo', 'Fernando Vasconcellos'), 'Romulo', 'Fernando Vasconcellos'),
            mentor_role = CASE WHEN mentor_role = 'mentor_romulo' THEN 'mentor_fernando' ELSE mentor_role END
        WHERE code ILIKE '%romulo%' OR name ILIKE '%romulo%' OR name ILIKE '%rômulo%' OR mentor_role = 'mentor_romulo';
    END IF;
END $$;

-- 6. After verification, the legacy 'mentor_romulo' value can be removed from CHECK constraint
-- by running this manually:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check
--     CHECK (role IN ('aluno', 'assessoria', 'externo', 'mentor_marcos', 'mentor_iria',
--                     'mentor_guilherme', 'mentor_fernando', 'mentor', 'admin'));
