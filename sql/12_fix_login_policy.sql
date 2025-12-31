-- =============================================
-- WARD ACADEMY - CORRECAO PARA LOGIN
-- Execute este script no Supabase SQL Editor
-- =============================================

-- PASSO 1: Desabilitar RLS na tabela users para permitir login
-- (Ou criar politica publica)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Renomear coluna full_name para name (se existir)
-- O codigo JavaScript espera 'name', nao 'full_name'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE users RENAME COLUMN full_name TO name;
    END IF;
END $$;

-- PASSO 3: Atualizar senha do Marcos conforme especificado
UPDATE users
SET password_hash = 'Luna11anos'
WHERE email = 'marcosantoniodv@gmail.com';

-- PASSO 4: Verificar se o usuario existe, se nao criar
INSERT INTO users (email, password_hash, name, role, first_login_completed)
VALUES ('marcosantoniodv@gmail.com', 'Luna11anos', 'Marcos Antonio Dias Vilela', 'mentor_marcos', TRUE)
ON CONFLICT (email)
DO UPDATE SET
    password_hash = 'Luna11anos',
    name = 'Marcos Antonio Dias Vilela',
    role = 'mentor_marcos',
    first_login_completed = TRUE;

-- PASSO 5: Inserir outros mentores (se nao existirem)
INSERT INTO users (email, password_hash, name, role, first_login_completed) VALUES
    ('costamdiria@gmail.com', 'ward2024', 'Iria Cassia Abreu da Costa', 'mentor_iria', TRUE),
    ('guilhermelavor@yahoo.com.br', 'ward2024', 'Guilherme De Lavor Araujo', 'mentor_guilherme', TRUE),
    ('romulossanglard@gmail.com', 'ward2024', 'Romulo da Silva Sanglard', 'mentor_romulo', TRUE)
ON CONFLICT (email) DO NOTHING;

-- PASSO 6: Verificar os dados
SELECT 'Usuarios cadastrados:' as info;
SELECT id, email, name, role, first_login_completed, password_hash FROM users;
