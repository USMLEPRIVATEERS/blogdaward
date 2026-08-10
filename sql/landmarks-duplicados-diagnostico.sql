-- ============================================================
-- Diagnostico e limpeza de landmarks duplicados
-- ============================================================
-- Sintoma: na pagina de landmarks do aluno aparecem chamadas repetidas,
-- com exatamente o mesmo nome.
--
-- Causa: a auditoria ("Auditar Landmarks", no dashboard do Marcos) lia todos
-- os landmarks de todos os alunos numa unica query. Com ~50 alunos x ~67
-- landmarks sao ~3.350 linhas, acima do "Max rows" do Supabase (1000 por
-- padrao). A resposta vinha cortada, a auditoria concluia que a maioria dos
-- alunos estava sem landmarks e reinseria o roteiro inteiro. Cada clique em
-- "Auditar" multiplicava as chamadas.
--
-- O codigo ja foi corrigido (leitura paginada + checagem por aluno antes de
-- inserir). Este arquivo serve para (1) medir o estrago e (2) limpar.
--
-- COMO USAR: rode a PARTE 1 primeiro e confira os numeros. Só depois, e se
-- quiser limpar pelo banco em vez de pelo botao "Auditar", rode a PARTE 2.
-- ============================================================


-- ============================================================
-- PARTE 1 - DIAGNOSTICO (somente leitura, seguro)
-- ============================================================

-- 1.1 Resumo geral: quantos grupos duplicados e quantas linhas sobrando
SELECT
    COUNT(*)                      AS grupos_duplicados,
    SUM(qtd - 1)                  AS linhas_sobrando,
    COUNT(DISTINCT user_id)       AS alunos_afetados,
    MAX(qtd)                      AS maior_repeticao
FROM (
    SELECT user_id, landmark_type, COUNT(*) AS qtd
    FROM landmarks
    GROUP BY user_id, landmark_type
    HAVING COUNT(*) > 1
) d;

-- 1.2 Por aluno: quantas duplicatas cada um tem
SELECT
    u.id            AS user_id,
    u.full_name,
    u.role,
    SUM(d.qtd - 1)  AS linhas_sobrando,
    COUNT(*)        AS itens_duplicados
FROM (
    SELECT user_id, landmark_type, COUNT(*) AS qtd
    FROM landmarks
    GROUP BY user_id, landmark_type
    HAVING COUNT(*) > 1
) d
JOIN users u ON u.id = d.user_id
GROUP BY u.id, u.full_name, u.role
ORDER BY linhas_sobrando DESC;

-- 1.3 Detalhe: cada linha duplicada, com o que ela carrega de informacao.
--     "posicao = 1" e a copia que a limpeza mantem.
SELECT
    l.user_id,
    u.full_name,
    l.landmark_type,
    l.id,
    l.title,
    l.completed,
    COALESCE(jsonb_array_length(
        CASE WHEN jsonb_typeof(l.notes::jsonb) = 'array' THEN l.notes::jsonb ELSE '[]'::jsonb END
    ), 0)                                                        AS qtd_observacoes,
    EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = l.id) AS tem_agendamento,
    l.created_at,
    ROW_NUMBER() OVER (
        PARTITION BY l.user_id, l.landmark_type
        ORDER BY
            l.completed DESC,
            COALESCE(jsonb_array_length(
                CASE WHEN jsonb_typeof(l.notes::jsonb) = 'array' THEN l.notes::jsonb ELSE '[]'::jsonb END
            ), 0) DESC,
            (EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = l.id)) DESC,
            l.id ASC
    ) AS posicao
FROM landmarks l
JOIN users u ON u.id = l.user_id
WHERE (l.user_id, l.landmark_type) IN (
    SELECT user_id, landmark_type
    FROM landmarks
    GROUP BY user_id, landmark_type
    HAVING COUNT(*) > 1
)
ORDER BY l.user_id, l.landmark_type, posicao;

-- 1.4 Quantas duplicatas NAO podem ser apagadas com seguranca
--     (tem progresso proprio: concluida, com observacoes ou com agendamento).
--     Se der 0, a limpeza da PARTE 2 remove tudo que sobra.
SELECT COUNT(*) AS duplicatas_com_progresso_preservadas
FROM (
    SELECT
        l.id,
        l.completed,
        COALESCE(jsonb_array_length(
            CASE WHEN jsonb_typeof(l.notes::jsonb) = 'array' THEN l.notes::jsonb ELSE '[]'::jsonb END
        ), 0) AS qtd_observacoes,
        EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = l.id) AS tem_agendamento,
        ROW_NUMBER() OVER (
            PARTITION BY l.user_id, l.landmark_type
            ORDER BY
                l.completed DESC,
                COALESCE(jsonb_array_length(
                    CASE WHEN jsonb_typeof(l.notes::jsonb) = 'array' THEN l.notes::jsonb ELSE '[]'::jsonb END
                ), 0) DESC,
                (EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = l.id)) DESC,
                l.id ASC
        ) AS posicao
    FROM landmarks l
    WHERE (l.user_id, l.landmark_type) IN (
        SELECT user_id, landmark_type
        FROM landmarks
        GROUP BY user_id, landmark_type
        HAVING COUNT(*) > 1
    )
) x
WHERE x.posicao > 1
  AND (x.completed OR x.qtd_observacoes > 0 OR x.tem_agendamento);


-- ============================================================
-- PARTE 2 - LIMPEZA (APAGA LINHAS - rode so depois de conferir a PARTE 1)
-- ============================================================
-- Regra: para cada (aluno, landmark_type) repetido, mantem UMA copia,
-- escolhida nesta ordem de prioridade:
--   1. concluida
--   2. com observacoes
--   3. com chamada agendada
--   4. a mais antiga (menor id)
-- E nunca apaga uma copia extra que tenha progresso proprio (concluida,
-- com observacoes ou com agendamento) - essas ficam para revisao manual,
-- e aparecem na consulta 1.4.
--
-- Esta transacao termina em ROLLBACK de proposito: rode assim primeiro para
-- ver o numero de linhas que SERIAM apagadas. Se o numero fizer sentido,
-- troque ROLLBACK por COMMIT na ultima linha e rode de novo.

BEGIN;

WITH ranked AS (
    SELECT
        l.id,
        l.completed,
        COALESCE(jsonb_array_length(
            CASE WHEN jsonb_typeof(l.notes::jsonb) = 'array' THEN l.notes::jsonb ELSE '[]'::jsonb END
        ), 0) AS qtd_observacoes,
        EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = l.id) AS tem_agendamento,
        ROW_NUMBER() OVER (
            PARTITION BY l.user_id, l.landmark_type
            ORDER BY
                l.completed DESC,
                COALESCE(jsonb_array_length(
                    CASE WHEN jsonb_typeof(l.notes::jsonb) = 'array' THEN l.notes::jsonb ELSE '[]'::jsonb END
                ), 0) DESC,
                (EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = l.id)) DESC,
                l.id ASC
        ) AS posicao
    FROM landmarks l
    WHERE (l.user_id, l.landmark_type) IN (
        SELECT user_id, landmark_type
        FROM landmarks
        GROUP BY user_id, landmark_type
        HAVING COUNT(*) > 1
    )
)
DELETE FROM landmarks
WHERE id IN (
    SELECT id
    FROM ranked
    WHERE posicao > 1
      AND NOT completed
      AND qtd_observacoes = 0
      AND NOT tem_agendamento
);

-- Confira quantas linhas o DELETE acima removeria:
SELECT COUNT(*) AS duplicatas_restantes
FROM (
    SELECT user_id, landmark_type
    FROM landmarks
    GROUP BY user_id, landmark_type
    HAVING COUNT(*) > 1
) d;

-- Troque para COMMIT quando os numeros estiverem certos.
ROLLBACK;


-- ============================================================
-- PARTE 3 - TRAVA NO BANCO (opcional, mas recomendado)
-- ============================================================
-- Depois que a PARTE 2 tiver rodado com COMMIT e a consulta 1.1 voltar zerada,
-- este indice impede que a duplicata volte a acontecer, venha de onde vier.
-- Se ainda houver duplicata, o CREATE falha - e isso e o comportamento certo.
--
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS landmarks_user_type_unique
--     ON landmarks (user_id, landmark_type);
