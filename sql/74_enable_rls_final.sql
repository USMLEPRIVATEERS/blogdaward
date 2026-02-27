-- =============================================
-- WARD ACADEMY - REABILITAR RLS APOS MIGRACAO
-- Execute SOMENTE quando TODOS os usuarios tiverem auth_id
-- =============================================

-- VERIFICAR PRIMEIRO: Quantos usuarios ainda nao tem auth_id?
SELECT
    COUNT(*) FILTER (WHERE auth_id IS NOT NULL) as migrados,
    COUNT(*) FILTER (WHERE auth_id IS NULL) as pendentes,
    COUNT(*) as total
FROM users;

-- Se pendentes > 0, NAO execute o resto deste script!

-- =============================================
-- HABILITAR RLS SOMENTE SE TODOS MIGRADOS
-- =============================================

DO $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_count FROM users WHERE auth_id IS NULL;

    IF pending_count > 0 THEN
        RAISE EXCEPTION 'ERRO: Ainda ha % usuarios sem auth_id. Migre todos antes de habilitar RLS!', pending_count;
    END IF;

    -- Habilitar RLS na tabela users
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'RLS habilitado com sucesso na tabela users!';
END $$;

-- =============================================
-- POLICIES PARA OUTRAS TABELAS (se necessario)
-- =============================================

-- Para cada tabela sensivel, adicionar policies similares:
-- 1. Usuario ve seus proprios dados
-- 2. Mentores veem tudo

-- Exemplo para user_tutorials:
-- ALTER TABLE user_tutorials ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_tutorials_own ON user_tutorials FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
-- CREATE POLICY user_tutorials_mentor ON user_tutorials FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role LIKE 'mentor_%'));
