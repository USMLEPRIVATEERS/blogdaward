-- =============================================
-- WARD ACADEMY - FUNCOES DE SEGURANCA
-- Execute este arquivo no Supabase SQL Editor
-- =============================================

-- Habilitar extensao pgcrypto para hash seguro
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- FUNCAO: Hash de senha seguro com bcrypt
-- =============================================
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Verificar senha
-- =============================================
CREATE OR REPLACE FUNCTION verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Suporta tanto bcrypt novo quanto base64 legado
    IF password_hash LIKE '$2%' THEN
        -- Hash bcrypt
        RETURN password_hash = crypt(password, password_hash);
    ELSE
        -- Hash legado (base64) - para migração
        RETURN password_hash = encode((password || '_ward_salt_2024')::bytea, 'base64')
            OR password_hash = password;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Login seguro (retorna dados do usuario)
-- =============================================
CREATE OR REPLACE FUNCTION secure_login(
    p_cpf TEXT,
    p_password TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_result JSON;
BEGIN
    -- Buscar usuario pelo CPF
    SELECT * INTO v_user
    FROM users
    WHERE cpf = p_cpf;

    -- Verificar se usuario existe
    IF v_user IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF ou senha incorretos'
        );
    END IF;

    -- Verificar se usuario esta inativo
    IF v_user.status = 'inactive' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Esta conta está inativa. Entre em contato com o administrador.'
        );
    END IF;

    -- Verificar senha
    IF NOT verify_password(p_password, v_user.password_hash) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF ou senha incorretos'
        );
    END IF;

    -- Login bem sucedido - retornar dados do usuario (SEM password_hash)
    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'cpf', v_user.cpf,
            'full_name', COALESCE(v_user.full_name, v_user.name, v_user.cpf),
            'name', COALESCE(v_user.name, v_user.full_name, v_user.cpf),
            'role', v_user.role,
            'first_login_completed', v_user.first_login_completed,
            'questionnaire_step', COALESCE(v_user.questionnaire_step, 0),
            'status', v_user.status
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Registro seguro de usuario
-- =============================================
CREATE OR REPLACE FUNCTION secure_register(
    p_cpf TEXT,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'aluno'
)
RETURNS JSON AS $$
DECLARE
    v_user_id BIGINT;
    v_hashed_password TEXT;
BEGIN
    -- Verificar se CPF ja existe
    IF EXISTS (SELECT 1 FROM users WHERE cpf = p_cpf) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF já cadastrado'
        );
    END IF;

    -- Verificar se email ja existe
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email já cadastrado'
        );
    END IF;

    -- Criar hash seguro da senha
    v_hashed_password := crypt(p_password, gen_salt('bf', 10));

    -- Inserir usuario
    INSERT INTO users (cpf, email, password_hash, full_name, role, first_login_completed, questionnaire_step, status)
    VALUES (p_cpf, p_email, v_hashed_password, p_full_name, p_role, false, 0, 'active')
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'message', 'Usuário criado com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Alterar senha (usuario logado)
-- =============================================
CREATE OR REPLACE FUNCTION change_password(
    p_user_id BIGINT,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
    v_current_hash TEXT;
BEGIN
    -- Buscar hash atual
    SELECT password_hash INTO v_current_hash
    FROM users
    WHERE id = p_user_id;

    IF v_current_hash IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;

    -- Verificar senha atual
    IF NOT verify_password(p_old_password, v_current_hash) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Senha atual incorreta'
        );
    END IF;

    -- Atualizar para nova senha com bcrypt
    UPDATE users
    SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Senha alterada com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Verificar se usuario e mentor
-- =============================================
CREATE OR REPLACE FUNCTION is_user_mentor(p_user_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    RETURN v_role LIKE 'mentor_%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Verificar se usuario pode acessar dados de outro
-- (mentor pode ver alunos, usuario pode ver seus proprios dados)
-- =============================================
CREATE OR REPLACE FUNCTION can_access_user_data(
    p_requesting_user_id BIGINT,
    p_target_user_id BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Usuario pode acessar seus proprios dados
    IF p_requesting_user_id = p_target_user_id THEN
        RETURN true;
    END IF;

    -- Mentor pode acessar dados de qualquer aluno
    IF is_user_mentor(p_requesting_user_id) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Carregar dados do questionario (com verificacao)
-- =============================================
CREATE OR REPLACE FUNCTION get_questionnaire_data(
    p_requesting_user_id BIGINT,
    p_target_user_id BIGINT,
    p_step INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_data JSONB;
BEGIN
    -- Verificar permissao
    IF NOT can_access_user_data(p_requesting_user_id, p_target_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Acesso negado'
        );
    END IF;

    -- Buscar dados
    SELECT data INTO v_data
    FROM questionnaire_data
    WHERE user_id = p_target_user_id AND step = p_step;

    RETURN json_build_object(
        'success', true,
        'data', v_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Salvar dados do questionario (com verificacao)
-- =============================================
CREATE OR REPLACE FUNCTION save_questionnaire_data(
    p_requesting_user_id BIGINT,
    p_target_user_id BIGINT,
    p_step INTEGER,
    p_data JSONB
)
RETURNS JSON AS $$
BEGIN
    -- Verificar permissao
    IF NOT can_access_user_data(p_requesting_user_id, p_target_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Acesso negado'
        );
    END IF;

    -- Upsert dos dados
    INSERT INTO questionnaire_data (user_id, step, data, updated_at)
    VALUES (p_target_user_id, p_step, p_data, NOW())
    ON CONFLICT (user_id, step)
    DO UPDATE SET data = p_data, updated_at = NOW();

    -- Atualizar progresso do usuario se step for maior
    UPDATE users
    SET questionnaire_step = GREATEST(questionnaire_step, p_step)
    WHERE id = p_target_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Dados salvos com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Listar usuarios (apenas mentores)
-- =============================================
CREATE OR REPLACE FUNCTION list_users(p_requesting_user_id BIGINT)
RETURNS JSON AS $$
BEGIN
    -- Verificar se e mentor
    IF NOT is_user_mentor(p_requesting_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Apenas mentores podem listar usuários'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'users', (
            SELECT json_agg(json_build_object(
                'id', id,
                'email', email,
                'cpf', cpf,
                'full_name', COALESCE(full_name, name),
                'role', role,
                'status', status,
                'first_login_completed', first_login_completed,
                'questionnaire_step', questionnaire_step,
                'created_at', created_at
            ) ORDER BY COALESCE(full_name, name))
            FROM users
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCAO: Migrar senhas legadas para bcrypt
-- (Execute uma vez para migrar senhas existentes)
-- =============================================
CREATE OR REPLACE FUNCTION migrate_legacy_passwords()
RETURNS TABLE(user_id BIGINT, migrated BOOLEAN) AS $$
DECLARE
    v_user RECORD;
BEGIN
    FOR v_user IN
        SELECT id, password_hash
        FROM users
        WHERE password_hash NOT LIKE '$2%'  -- Nao e bcrypt
    LOOP
        -- Para senhas legadas, precisamos que o usuario faca login novamente
        -- ou resetamos para uma senha padrao temporaria
        -- Por seguranca, vamos marcar quais precisam migrar
        user_id := v_user.id;
        migrated := false;
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT: Permitir que usuario anonimo execute funcoes
-- =============================================
GRANT EXECUTE ON FUNCTION secure_login TO anon;
GRANT EXECUTE ON FUNCTION secure_register TO anon;
GRANT EXECUTE ON FUNCTION verify_password TO anon;

-- Funcoes para usuarios autenticados
GRANT EXECUTE ON FUNCTION change_password TO authenticated;
GRANT EXECUTE ON FUNCTION get_questionnaire_data TO authenticated, anon;
GRANT EXECUTE ON FUNCTION save_questionnaire_data TO authenticated, anon;
GRANT EXECUTE ON FUNCTION list_users TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_access_user_data TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_user_mentor TO authenticated, anon;
