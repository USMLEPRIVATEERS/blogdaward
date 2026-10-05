-- =============================================
-- WARD ACADEMY - Tempo de mentoria de cada aluno
-- =============================================
-- Regra:
--   * cadastrado ANTES de 01/06/2026  -> acesso permanente, nunca vence;
--   * cadastrado de 01/06/2026 em diante -> 18 meses a partir do cadastro.
--     Quando o aluno paga de novo, o mentor marca a renovacao no dashboard e
--     o fim avanca mais 18 meses.
--
-- created_at e timestamptz e o banco responde em UTC: as 22h de 31/05 em
-- Brasilia ja sao 01/06 la. Quem se cadastrou na vespera do corte perderia o
-- acesso permanente por causa disso, entao toda data aqui e lida no fuso de
-- Sao Paulo, que e o fuso em que a Ward cadastra.
--
-- Seguro de rodar mais de uma vez: so preenche o que ainda esta NULL, entao
-- nao desfaz renovacao nenhuma que ja tenha sido marcada.
-- =============================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mentoria_inicio DATE,
    ADD COLUMN IF NOT EXISTS mentoria_fim DATE,
    ADD COLUMN IF NOT EXISTS mentoria_vitalicia BOOLEAN,
    ADD COLUMN IF NOT EXISTS mentoria_renovacoes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users.mentoria_inicio IS 'Inicio da mentoria; por padrao, a data de cadastro';
COMMENT ON COLUMN users.mentoria_fim IS 'Ultimo dia de acesso; NULL quando o acesso e permanente';
COMMENT ON COLUMN users.mentoria_vitalicia IS 'TRUE = acesso permanente (cadastro anterior a 01/06/2026)';
COMMENT ON COLUMN users.mentoria_renovacoes IS 'Historico de renovacoes: [{data, meses, ate, por}]';

-- ---------------------------------------------------------------------------
-- 1. Preenche os alunos que ja existem
-- ---------------------------------------------------------------------------
UPDATE users
   SET mentoria_inicio = (created_at AT TIME ZONE 'America/Sao_Paulo')::date
 WHERE role = 'aluno' AND mentoria_inicio IS NULL AND created_at IS NOT NULL;

-- Antes de junho de 2026: permanente.
UPDATE users
   SET mentoria_vitalicia = TRUE,
       mentoria_fim = NULL
 WHERE role = 'aluno'
   AND mentoria_vitalicia IS NULL
   AND mentoria_inicio IS NOT NULL
   AND mentoria_inicio < DATE '2026-06-01';

-- De junho de 2026 em diante: 18 meses contados do inicio.
UPDATE users
   SET mentoria_vitalicia = FALSE,
       mentoria_fim = COALESCE(mentoria_fim, (mentoria_inicio + INTERVAL '18 months')::date)
 WHERE role = 'aluno'
   AND mentoria_vitalicia IS NULL
   AND mentoria_inicio IS NOT NULL
   AND mentoria_inicio >= DATE '2026-06-01';

UPDATE users
   SET mentoria_renovacoes = '[]'::jsonb
 WHERE mentoria_renovacoes IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Preenche sozinho quem entrar daqui para a frente
-- ---------------------------------------------------------------------------
-- O gatilho so completa o que vier vazio: um INSERT ou UPDATE que ja traga as
-- datas (a renovacao marcada pelo mentor, por exemplo) passa intocado.
CREATE OR REPLACE FUNCTION set_mentoria_padrao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role <> 'aluno' THEN
        RETURN NEW;
    END IF;

    IF NEW.mentoria_inicio IS NULL THEN
        -- No INSERT vale a data do cadastro. Quando alguem VIRA aluno depois
        -- (assessoria que fecha a mentoria), a mentoria comeca hoje, nao na
        -- data em que a conta foi criada.
        IF TG_OP = 'INSERT' THEN
            NEW.mentoria_inicio := (COALESCE(NEW.created_at, NOW())
                                    AT TIME ZONE 'America/Sao_Paulo')::date;
        ELSE
            NEW.mentoria_inicio := (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;
        END IF;
    END IF;

    IF NEW.mentoria_vitalicia IS NULL THEN
        NEW.mentoria_vitalicia := NEW.mentoria_inicio < DATE '2026-06-01';
    END IF;

    IF NEW.mentoria_vitalicia THEN
        NEW.mentoria_fim := NULL;
    ELSIF NEW.mentoria_fim IS NULL THEN
        NEW.mentoria_fim := (NEW.mentoria_inicio + INTERVAL '18 months')::date;
    END IF;

    IF NEW.mentoria_renovacoes IS NULL THEN
        NEW.mentoria_renovacoes := '[]'::jsonb;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mentoria_padrao ON users;
CREATE TRIGGER trg_mentoria_padrao
    BEFORE INSERT OR UPDATE OF role ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_mentoria_padrao();

-- ---------------------------------------------------------------------------
-- 3. Conferencia
-- ---------------------------------------------------------------------------
-- SELECT CASE WHEN mentoria_vitalicia THEN 'permanente' ELSE 'com prazo' END AS acesso,
--        COUNT(*)
--   FROM users WHERE role = 'aluno' GROUP BY 1;
