-- =============================================
-- WARD ACADEMY - PROTECAO DE ACESSO DE MENTORES
-- Execute este script para proteger contra alteracoes
-- maliciosas de roles e dados sensíveis
-- =============================================

-- 1. PROTEGER ROLES DE MENTOR (impede criar novos mentores)
CREATE OR REPLACE FUNCTION check_mentor_role()
RETURNS TRIGGER AS $$
DECLARE
    allowed_mentor_ids INTEGER[] := ARRAY[1, 2, 3, 4];
BEGIN
    -- Se tentando definir role como mentor_*
    IF NEW.role LIKE 'mentor_%' THEN
        -- Só permite se for um dos 4 IDs de mentor
        IF NEW.id != ALL(allowed_mentor_ids) THEN
            RAISE EXCEPTION 'Operacao nao permitida: apenas usuarios autorizados podem ter role de mentor';
        END IF;
    END IF;

    -- Se tentando MUDAR role de um mentor existente
    IF TG_OP = 'UPDATE' AND OLD.role LIKE 'mentor_%' THEN
        -- Ninguem pode mudar o role de um mentor
        IF NEW.role != OLD.role THEN
            RAISE EXCEPTION 'Operacao nao permitida: nao e possivel alterar role de mentores';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS check_mentor_role_insert ON users;
CREATE TRIGGER check_mentor_role_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_mentor_role();

DROP TRIGGER IF EXISTS check_mentor_role_update ON users;
CREATE TRIGGER check_mentor_role_update
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_mentor_role();

-- 2. IMPEDIR ALUNOS DE ALTERAR DADOS DE OUTROS USUARIOS
-- Esta funcao verifica se a operacao e permitida
CREATE OR REPLACE FUNCTION check_user_update_permission()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
    current_user_id INTEGER;
BEGIN
    -- Tentar obter o usuario atual via auth.uid()
    -- Se auth.uid() for NULL, a operacao veio de um cliente nao autenticado via Supabase Auth

    -- Para usuarios autenticados via Supabase Auth
    IF auth.uid() IS NOT NULL THEN
        SELECT role, id INTO current_user_role, current_user_id
        FROM users
        WHERE auth_id = auth.uid();

        -- Se encontrou usuario autenticado
        IF current_user_role IS NOT NULL THEN
            -- Mentores podem alterar qualquer usuario
            IF current_user_role LIKE 'mentor_%' THEN
                RETURN NEW;
            END IF;

            -- Outros usuarios so podem alterar seus proprios dados
            IF current_user_id != OLD.id THEN
                RAISE EXCEPTION 'Operacao nao permitida: voce so pode alterar seus proprios dados';
            END IF;

            -- Usuarios nao podem mudar seu proprio role
            IF NEW.role != OLD.role THEN
                RAISE EXCEPTION 'Operacao nao permitida: voce nao pode alterar seu proprio role';
            END IF;
        END IF;
    END IF;

    -- Se auth.uid() e NULL, permite a operacao (sistema legado)
    -- Mas as outras protecoes (check_mentor_role) ainda se aplicam

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_user_update_permission ON users;
CREATE TRIGGER check_user_update_permission
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_update_permission();

-- 3. VERIFICAR E LIMPAR MENTORES FALSOS
-- Primeiro veja se tem algum:
SELECT id, cpf, email, role, full_name, created_at
FROM users
WHERE role LIKE 'mentor_%'
AND id NOT IN (1, 2, 3, 4);

-- Se encontrar, delete:
-- DELETE FROM users WHERE role LIKE 'mentor_%' AND id NOT IN (1, 2, 3, 4);

-- 4. RESTAURAR ROLE DO MARCOS (se foi alterado)
UPDATE users SET role = 'mentor_marcos' WHERE id = 1;

-- 5. VERIFICAR MENTORES ATUAIS
SELECT id, cpf, email, role, full_name, auth_id
FROM users
WHERE id IN (1, 2, 3, 4);
