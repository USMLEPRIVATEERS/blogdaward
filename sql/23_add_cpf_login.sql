-- =============================================
-- WARD ACADEMY - Trocar login de email para CPF
-- =============================================

-- Adicionar coluna CPF na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(11) UNIQUE;

-- Atualizar todos os usuários existentes com CPF padrão 12345678900
UPDATE users SET cpf = '12345678900' WHERE cpf IS NULL;

-- Criar índice para buscas rápidas por CPF
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Comentário
COMMENT ON COLUMN users.cpf IS 'CPF do usuário (apenas números, 11 dígitos)';
