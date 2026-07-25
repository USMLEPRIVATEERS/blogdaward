-- =============================================
-- Criar Teste: "questões já usadas" no Supabase
--
-- O localStorage continua sendo a fonte imediata (rápido, funciona offline e
-- sem login). Esta tabela é o espelho, para a lista não se perder e para
-- sincronizar entre aparelhos.
--
-- Desenho compacto: UMA linha por (aluno, QBank, Step), com a lista de IDs.
-- Com 50 membros são no máximo 300 linhas (~1-4 MB) — menos de 1% do plano
-- gratuito do Supabase.
--
-- removed_ids são "lápides": IDs que a pessoa apagou de propósito. Sem eles,
-- juntar as listas de dois aparelhos faria a questão removida voltar sempre.
-- Com eles, tanto adicionar quanto remover se propagam.
-- =============================================

CREATE TABLE IF NOT EXISTS qbank_used_questions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank        TEXT NOT NULL,          -- 'UWorld' | 'Mehlman'
    step        TEXT NOT NULL,          -- 'Step 1' | 'Step 2 CK' | 'Step 3'
    done_ids    INTEGER[] NOT NULL DEFAULT '{}',   -- questões marcadas como feitas
    removed_ids INTEGER[] NOT NULL DEFAULT '{}',   -- apagadas de propósito (lápides)
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, bank, step)
);

CREATE INDEX IF NOT EXISTS idx_qbank_used_user ON qbank_used_questions(user_id);

-- O app acessa via /api/data/query (service_role), que já força user_id = você.
GRANT SELECT, INSERT, UPDATE, DELETE ON qbank_used_questions TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Conferência
SELECT 'qbank_used_questions criada' AS status,
       (SELECT COUNT(*) FROM qbank_used_questions) AS linhas;
