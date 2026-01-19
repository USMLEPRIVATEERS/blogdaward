-- =============================================
-- WARD ACADEMY - HASH SEGURO DE SENHAS (BCRYPT)
-- Execute este script para migrar de base64 para bcrypt
-- =============================================

-- 1. Habilitar extensao de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Funcao para criar hash bcrypt
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Funcao para verificar senha
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF hash IS NULL OR hash = '' THEN
        RETURN FALSE;
    END IF;
    RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Funcao RPC para login seguro (verificacao no servidor)
CREATE OR REPLACE FUNCTION secure_login(p_cpf TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar usuario
    SELECT * INTO user_record FROM users WHERE cpf = p_cpf;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado');
    END IF;

    -- Verificar status
    IF user_record.status = 'inactive' THEN
        RETURN json_build_object('success', false, 'error', 'Conta inativa');
    END IF;

    -- Se tem auth_id, deve usar Supabase Auth
    IF user_record.auth_id IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Use Supabase Auth para este usuario', 'use_supabase_auth', true);
    END IF;

    -- Verificar senha com bcrypt
    IF NOT verify_password(p_password, user_record.password_hash) THEN
        RETURN json_build_object('success', false, 'error', 'Senha incorreta');
    END IF;

    -- Retornar dados do usuario (sem senha)
    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'cpf', user_record.cpf,
            'email', user_record.email,
            'name', user_record.name,
            'full_name', user_record.full_name,
            'role', user_record.role,
            'auth_id', user_record.auth_id,
            'status', user_record.status,
            'first_login_completed', user_record.first_login_completed,
            'questionnaire_step', user_record.questionnaire_step
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funcao para atualizar senha (usado na troca de senha)
CREATE OR REPLACE FUNCTION update_user_password(p_user_id INTEGER, p_old_password TEXT, p_new_password TEXT)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar usuario
    SELECT * INTO user_record FROM users WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado');
    END IF;

    -- Se tem auth_id, deve usar Supabase Auth
    IF user_record.auth_id IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Use Supabase Auth para alterar senha');
    END IF;

    -- Verificar senha atual
    IF NOT verify_password(p_old_password, user_record.password_hash) THEN
        RETURN json_build_object('success', false, 'error', 'Senha atual incorreta');
    END IF;

    -- Atualizar para nova senha com bcrypt
    UPDATE users
    SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. MIGRAR SENHAS EXISTENTES DE BASE64 PARA BCRYPT
-- Esta funcao converte senhas antigas para o novo formato
CREATE OR REPLACE FUNCTION migrate_passwords_to_bcrypt()
RETURNS TABLE(migrated INTEGER, failed INTEGER, skipped INTEGER) AS $$
DECLARE
    rec RECORD;
    original_password TEXT;
    migrated_count INTEGER := 0;
    failed_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT id, password_hash
        FROM users
        WHERE auth_id IS NULL
        AND password_hash IS NOT NULL
        AND password_hash != ''
        AND password_hash NOT LIKE '$2%' -- Nao migrar se ja e bcrypt
    LOOP
        BEGIN
            -- Tentar decodificar base64
            original_password := REPLACE(
                convert_from(decode(rec.password_hash, 'base64'), 'UTF8'),
                '_ward_salt_2024',
                ''
            );

            -- Atualizar para bcrypt
            UPDATE users
            SET password_hash = crypt(original_password, gen_salt('bf', 10))
            WHERE id = rec.id;

            migrated_count := migrated_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Se falhar a decodificacao, pode ser senha em texto puro
            BEGIN
                UPDATE users
                SET password_hash = crypt(rec.password_hash, gen_salt('bf', 10))
                WHERE id = rec.id;
                migrated_count := migrated_count + 1;
            EXCEPTION WHEN OTHERS THEN
                failed_count := failed_count + 1;
            END;
        END;
    END LOOP;

    -- Contar usuarios pulados (ja tem auth_id ou ja e bcrypt)
    SELECT COUNT(*) INTO skipped_count
    FROM users
    WHERE auth_id IS NOT NULL
       OR password_hash LIKE '$2%';

    RETURN QUERY SELECT migrated_count, failed_count, skipped_count;
END;
$$ LANGUAGE plpgsql;

-- 7. EXECUTAR MIGRACAO
SELECT * FROM migrate_passwords_to_bcrypt();

-- 8. Verificar resultado
SELECT
    id,
    cpf,
    CASE
        WHEN password_hash LIKE '$2%' THEN 'bcrypt'
        WHEN password_hash IS NULL THEN 'null'
        ELSE 'outro'
    END as tipo_hash,
    auth_id IS NOT NULL as tem_auth
FROM users
ORDER BY id
LIMIT 20;
