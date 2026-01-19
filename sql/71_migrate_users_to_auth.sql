-- =============================================
-- MIGRAÇÃO DE USUÁRIOS PARA SUPABASE AUTH
-- =============================================
--
-- IMPORTANTE: Este script precisa ser executado em DUAS etapas:
--
-- ETAPA 1: Criar usuários no Supabase Auth (via Dashboard ou API)
-- ETAPA 2: Vincular auth_id na nossa tabela users (este script)
--
-- =============================================

-- =============================================
-- ETAPA 2: VINCULAR AUTH_ID APÓS CRIAR USUÁRIOS NO AUTH
-- =============================================

-- Este script vincula os usuários da tabela auth.users com nossa tabela users
-- baseado no email (que deve ser igual em ambas as tabelas)

-- Atualizar auth_id para todos os usuários que têm email correspondente
UPDATE users u
SET auth_id = au.id
FROM auth.users au
WHERE LOWER(u.email) = LOWER(au.email)
AND u.auth_id IS NULL;

-- Verificar quantos foram vinculados
SELECT
    COUNT(*) FILTER (WHERE auth_id IS NOT NULL) as vinculados,
    COUNT(*) FILTER (WHERE auth_id IS NULL) as pendentes,
    COUNT(*) as total
FROM users;

-- Listar usuários ainda não vinculados (precisam ser criados no Auth)
SELECT id, email, full_name, role
FROM users
WHERE auth_id IS NULL
ORDER BY id;

-- =============================================
-- APÓS TODOS VINCULADOS: HABILITAR RLS
-- =============================================

-- Só execute esta parte quando TODOS os usuários tiverem auth_id!

-- Verificar se todos estão vinculados
DO $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_count FROM users WHERE auth_id IS NULL;

    IF pending_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Ainda há % usuários sem auth_id. Não habilite RLS ainda!', pending_count;
    ELSE
        RAISE NOTICE 'Todos os usuários estão vinculados! Pode habilitar RLS.';
    END IF;
END $$;

-- DESCOMENTE as linhas abaixo APENAS quando todos tiverem auth_id:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
