-- ============================================================
-- Diario UWorld: separar "tutor" de "timed"
-- ============================================================
-- O UWorld tem DOIS interruptores independentes:
--   - Tutor    on/off  (explicacao aparece a cada questao)
--   - Timed    on/off  (cronometro por bloco)
-- O campo "mode" guardava um valor so ('tutor', 'timed' ou 'untimed'), o que
-- forcava escolher um dos dois e perdia a outra metade da informacao.
--
-- Depois desta migracao:
--   mode        -> 'timed' ou 'untimed'   (so o cronometro)
--   tutor_mode  -> BOOLEAN                (so o tutor), padrao TRUE
--
-- Conversao dos registros que ja existem:
--   mode = 'tutor'     ->  tutor_mode = true,   mode = 'untimed'
--   mode = 'timed'     ->  tutor_mode = false,  mode = 'timed'
--   mode = 'untimed'   ->  tutor_mode = false,  mode = 'untimed'
--   mode nulo/vazio    ->  tutor_mode = true,   mode = 'untimed'  (o padrao)
--
-- E seguro rodar mais de uma vez.
-- ============================================================

BEGIN;

-- 1. Coluna nova, ainda sem default, para nao carimbar as linhas antigas
ALTER TABLE uworld_diary ADD COLUMN IF NOT EXISTS tutor_mode BOOLEAN;

-- 2. Backfill a partir do valor antigo (so nas linhas ainda nao convertidas)
UPDATE uworld_diary
SET tutor_mode = (mode = 'tutor' OR mode IS NULL OR mode = '')
WHERE tutor_mode IS NULL;

-- 3. "tutor" deixa de ser um valor de timing; vira untimed, que e o padrao
UPDATE uworld_diary
SET mode = 'untimed'
WHERE mode IS NULL OR mode = '' OR mode = 'tutor';

-- 4. A partir de agora, tutor ligado e o padrao
ALTER TABLE uworld_diary ALTER COLUMN tutor_mode SET DEFAULT TRUE;
ALTER TABLE uworld_diary ALTER COLUMN mode SET DEFAULT 'untimed';

-- 5. Troca a restricao antiga de mode (o nome varia conforme como a tabela
--    foi criada, entao a busca e pelo conteudo da checagem, nao pelo nome)
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        WHERE rel.relname = 'uworld_diary'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%mode%'
          AND pg_get_constraintdef(con.oid) ILIKE '%tutor%'
    LOOP
        EXECUTE format('ALTER TABLE uworld_diary DROP CONSTRAINT %I', c.conname);
        RAISE NOTICE 'restricao antiga removida: %', c.conname;
    END LOOP;
END $$;

ALTER TABLE uworld_diary DROP CONSTRAINT IF EXISTS uworld_diary_mode_timing_check;
ALTER TABLE uworld_diary
    ADD CONSTRAINT uworld_diary_mode_timing_check
    CHECK (mode IS NULL OR mode IN ('timed', 'untimed'));

COMMENT ON COLUMN uworld_diary.mode IS 'Cronometro do bloco: timed ou untimed';
COMMENT ON COLUMN uworld_diary.tutor_mode IS 'Tutor mode ligado (explicacao a cada questao)';

COMMIT;


-- ============================================================
-- CONFERENCIA (rode depois do COMMIT)
-- ============================================================
-- Distribuicao final. Nao pode sobrar nenhum mode = 'tutor'.
SELECT
    COALESCE(mode, '(nulo)') AS modo_tempo,
    tutor_mode,
    COUNT(*) AS registros
FROM uworld_diary
GROUP BY mode, tutor_mode
ORDER BY registros DESC;

-- Deve retornar 0
SELECT COUNT(*) AS linhas_com_mode_tutor_restantes
FROM uworld_diary
WHERE mode = 'tutor';

-- Deve retornar 0
SELECT COUNT(*) AS linhas_sem_tutor_mode
FROM uworld_diary
WHERE tutor_mode IS NULL;
