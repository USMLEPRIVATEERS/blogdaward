-- =============================================
-- WARD ACADEMY - FUNCAO: Criar usuario (uso administrativo)
-- Chamada pelo admin-members via RPC proxy (service role)
-- Autorizacao e feita na camada API (verifyAdmin)
-- =============================================

CREATE OR REPLACE FUNCTION create_user_secure(
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
    -- Validar CPF
    IF p_cpf IS NULL OR length(trim(p_cpf)) < 11 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF invalido'
        );
    END IF;

    -- Verificar se CPF ja existe
    IF EXISTS (SELECT 1 FROM users WHERE cpf = p_cpf) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF ja cadastrado'
        );
    END IF;

    -- Verificar se email ja existe (se fornecido)
    IF p_email IS NOT NULL AND p_email != '' THEN
        IF EXISTS (SELECT 1 FROM users WHERE email = p_email AND email != '') THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Email ja cadastrado'
            );
        END IF;
    END IF;

    -- Nao permitir criar novos mentores por esta funcao
    IF p_role LIKE 'mentor_%' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nao e permitido criar usuarios com role de mentor'
        );
    END IF;

    -- Criar hash seguro da senha com bcrypt
    v_hashed_password := crypt(p_password, gen_salt('bf', 10));

    -- Inserir usuario
    INSERT INTO users (cpf, email, password_hash, full_name, role, first_login_completed, questionnaire_step, status)
    VALUES (p_cpf, p_email, v_hashed_password, p_full_name, p_role, false, 0, 'active')
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'message', 'Usuario criado com sucesso'
    );

EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object(
        'success', false,
        'error', 'CPF ou email ja cadastrado'
    );
WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro ao criar usuario: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
