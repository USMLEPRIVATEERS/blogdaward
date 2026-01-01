-- =============================================
-- WARD ACADEMY - Trocar login de email para CPF
-- =============================================

-- Adicionar coluna CPF na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(11) UNIQUE;

-- Atualizar todos os usuários existentes com CPF único baseado no ID
-- Formato: ID preenchido com zeros à esquerda até 11 dígitos
UPDATE users
SET cpf = LPAD(id::text, 11, '0')
WHERE cpf IS NULL;

-- Criar índice para buscas rápidas por CPF
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Comentário
COMMENT ON COLUMN users.cpf IS 'CPF do usuário (apenas números, 11 dígitos)';
