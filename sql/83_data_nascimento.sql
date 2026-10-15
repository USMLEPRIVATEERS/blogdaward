-- =============================================
-- WARD ACADEMY - Data de nascimento e aniversarios
-- =============================================
-- A data mora em `users.birth_date` e nao so no questionario, porque os
-- dashboards dos mentores precisam consultar por mes e por dia (o calendario
-- de aniversarios). O questionario continua gravando no lugar de sempre; o
-- passo 1 passa a espelhar aqui.
--
-- Seguro de rodar mais de uma vez.
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN users.birth_date IS 'Data de nascimento (questionario passo 1 ou janela do dashboard)';

-- O calendario busca por mes/dia, nunca pelo ano.
CREATE INDEX IF NOT EXISTS idx_users_birth_md
    ON users ((EXTRACT(MONTH FROM birth_date)), (EXTRACT(DAY FROM birth_date)))
    WHERE birth_date IS NOT NULL;

-- Quem ja respondeu o questionario com data de nascimento: traz para a coluna.
-- (Nos cadastros atuais o campo nao existia, entao isso costuma nao achar nada
--  — fica aqui para quem preencher pelo questionario a partir de agora.)
UPDATE users u
   SET birth_date = (q.data ->> 'birth_date')::date
  FROM questionnaire_data q
 WHERE q.user_id = u.id
   AND u.birth_date IS NULL
   AND q.step = 1
   AND q.data ->> 'birth_date' IS NOT NULL
   AND q.data ->> 'birth_date' <> ''
   AND (q.data ->> 'birth_date') ~ '^\d{4}-\d{2}-\d{2}$';

-- Conferencia:
-- SELECT COUNT(*) FILTER (WHERE birth_date IS NOT NULL) AS com_data,
--        COUNT(*) AS alunos
--   FROM users WHERE role = 'aluno';
