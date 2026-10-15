-- =============================================
-- WARD ACADEMY - Planos do aluno
-- =============================================
-- O aluno continua sendo role = 'aluno' em todo lugar: bolsista e intensivo
-- tem o MESMO acesso a plataforma. O que muda e o plano, e dele saem tres
-- coisas: por quantos meses o acesso vale, quais chamadas o aluno tem, e se
-- ele enxerga as frentes do Dr. Fernando e do Dr. Andre.
--
--   mentoria   - o plano completo. 18 meses, roteiro inteiro.
--   bolsista   - 100% gratuito. 9 meses. Roteiro completo MENOS Fernando e
--                Dr. Andre, e nenhuma chamada com a Dra. Iria sem o Marcos
--                liberar (users.iria_liberadas).
--   intensivo  - pagou bem menos. Mesma plataforma, mas so 6 chamadas:
--                2 com a Iria, 2 com o Marcos e 2 com o Guilherme.
--
-- Por que plano e nao papel: 'aluno' e testado em 69 lugares do codigo
-- (dashboards, cronograma, progressao, questionario, aniversarios...). Criar
-- papeis novos sumiria com esses alunos de telas que eles devem continuar
-- vendo. O plano e um campo A MAIS, nao um papel diferente.
--
-- Seguro de rodar mais de uma vez.
-- =============================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS plano TEXT,
    ADD COLUMN IF NOT EXISTS iria_liberadas INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS plano_alterado_em TIMESTAMPTZ;

COMMENT ON COLUMN users.plano IS 'mentoria | bolsista | intensivo (so para role = aluno)';
COMMENT ON COLUMN users.iria_liberadas IS 'Quantas chamadas com a Dra. Iria o Marcos liberou para este bolsista';
COMMENT ON COLUMN users.plano_alterado_em IS 'Quando o plano mudou pela ultima vez';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plano_check;
ALTER TABLE users ADD CONSTRAINT users_plano_check
    CHECK (plano IS NULL OR plano IN ('mentoria', 'bolsista', 'intensivo'));

-- Quem ja esta na base e aluno do plano completo.
UPDATE users SET plano = 'mentoria' WHERE role = 'aluno' AND plano IS NULL;
UPDATE users SET iria_liberadas = 0 WHERE iria_liberadas IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_plano ON users(plano) WHERE plano IS NOT NULL;

-- Conferencia:
-- SELECT COALESCE(plano, 'sem plano') AS plano, COUNT(*)
--   FROM users WHERE role = 'aluno' GROUP BY 1 ORDER BY 2 DESC;
