-- =============================================
-- WARD ACADEMY - Trocar login de email para CPF
-- =============================================

-- Remover constraint UNIQUE se existir (para recriar limpo)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_cpf_key;

-- Adicionar coluna CPF se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

-- Atualizar TODOS os usuários com CPF único baseado no ID
-- Formato: ID preenchido com zeros à esquerda até 11 dígitos
-- Isso sobrescreve qualquer CPF que já existia
UPDATE users
SET cpf = LPAD(id::text, 11, '0');

-- Adicionar constraint UNIQUE de volta
ALTER TABLE users ADD CONSTRAINT users_cpf_key UNIQUE (cpf);

-- Criar índice para buscas rápidas por CPF
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Comentário
COMMENT ON COLUMN users.cpf IS 'CPF do usuário (apenas números, 11 dígitos)';
