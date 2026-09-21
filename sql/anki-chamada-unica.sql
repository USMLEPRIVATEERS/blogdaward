-- ============================================================================
--  Ward Academy — a revisao do Anki com o Guilherme vira chamada unica
--
--  Para quem JA rodou sql/roteiro-chamadas-novo.sql. Se voce ainda nao rodou
--  aquele, nao precisa deste: o roteiro ja sai correto de la.
--
--  A chamada era uma vaga permanente no grupo de seguimento (dava para agendar
--  quantas vezes quisesse). Agora e uma chamada unica, na Imersao, logo depois
--  de "configurando o Anki do zero".
--
--  Roda numa transacao e pode ser rodado de novo sem efeito nenhum.
-- ============================================================================

BEGIN;

-- 1) a chamada (e os agendamentos que ja foram feitos por ela) mudam de grupo
UPDATE landmarks
SET    group_name = 'imersao',
       order_position = 4,
       updated_at = NOW()
WHERE  landmark_type IN ('call_guilherme_anki_update', 'call_guilherme_anki_update__oc')
  AND  (group_name IS DISTINCT FROM 'imersao' OR order_position IS DISTINCT FROM 4);

-- 2) nome novo: "atualizando e revisando" dava ideia de repeticao
UPDATE landmarks
SET    title = 'Guilherme: revisando o seu Anki',
       updated_at = NOW()
WHERE  landmark_type = 'call_guilherme_anki_update'
  AND  title IS DISTINCT FROM 'Guilherme: revisando o seu Anki';

-- 3) as ocorrencias acompanham o nome, preservando a data (ou o assunto)
UPDATE landmarks
SET    title = 'Guilherme: revisando o seu Anki — ' || substring(title from position(' — ' in title) + 3),
       updated_at = NOW()
WHERE  landmark_type = 'call_guilherme_anki_update__oc'
  AND  position(' — ' in title) > 0
  AND  title NOT LIKE 'Guilherme: revisando o seu Anki — %';

COMMIT;

-- Conferencia
SELECT landmark_type, title, group_name, COUNT(*) AS quantas
FROM   landmarks
WHERE  landmark_type LIKE 'call_guilherme_anki_update%'
GROUP  BY 1, 2, 3
ORDER  BY 1, 2;
