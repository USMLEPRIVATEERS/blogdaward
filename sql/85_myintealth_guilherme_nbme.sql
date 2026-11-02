-- ============================================================================
--  Ward Academy — Myintealth com o Guilherme e NBME com Iria, Guilherme ou Marcos
--  (02/11/2026)
--
--  1. A primeira chamada do Myintealth (criar a conta) passa a ser com o
--     Guilherme. O tipo continua 'call_marcos_myintealth_conta' para nao soltar
--     o historico; muda so o nome. Quem ja fez, ou ja tem horario marcado,
--     fica como esta (o nome continua dizendo com quem foi).
--  2. A chamada de resultado do NBME / self assessment pode ser com a Iria, o
--     Guilherme ou o Marcos: o aluno escolhe ao agendar. Muda o nome da vaga;
--     as ocorrencias (cada simulado ja agendado) ficam como estao.
--
--  A plataforma ja funciona sem este SQL (ela olha o tipo da chamada); ele so
--  acerta o nome que aparece na lista. Roda numa transacao e pode ser rodado
--  de novo sem efeito nenhum.
-- ============================================================================

BEGIN;

-- 1) Myintealth: pendentes e sem horario marcado
UPDATE landmarks l
SET    title = 'Guilherme: criando a sua conta no Myintealth',
       updated_at = NOW()
WHERE  l.landmark_type = 'call_marcos_myintealth_conta'
  AND  l.completed = false
  AND  l.title IS DISTINCT FROM 'Guilherme: criando a sua conta no Myintealth'
  AND  NOT EXISTS (
         SELECT 1 FROM scheduled_calls s
         WHERE  s.landmark_id = l.id AND s.status = 'scheduled'
       );

-- 2) NBME / self assessment: a vaga de cada prova
UPDATE landmarks
SET    title = 'Iria, Guilherme ou Marcos: avaliando o seu resultado no self assessment do Step 1',
       updated_at = NOW()
WHERE  landmark_type = 'call_iria_self_assessment'
  AND  title IS DISTINCT FROM 'Iria, Guilherme ou Marcos: avaliando o seu resultado no self assessment do Step 1';

UPDATE landmarks
SET    title = 'Iria, Guilherme ou Marcos: avaliando o seu resultado no self assessment do Step 2 CK',
       updated_at = NOW()
WHERE  landmark_type = 'call_iria_self_assessment__s2'
  AND  title IS DISTINCT FROM 'Iria, Guilherme ou Marcos: avaliando o seu resultado no self assessment do Step 2 CK';

UPDATE landmarks
SET    title = 'Iria, Guilherme ou Marcos: avaliando o seu resultado no self assessment do Step 3',
       updated_at = NOW()
WHERE  landmark_type = 'call_iria_self_assessment__s3'
  AND  title IS DISTINCT FROM 'Iria, Guilherme ou Marcos: avaliando o seu resultado no self assessment do Step 3';

COMMIT;

-- Conferencia
SELECT landmark_type, title, completed, COUNT(*) AS chamadas
FROM   landmarks
WHERE  landmark_type IN ('call_marcos_myintealth_conta', 'call_iria_self_assessment',
                         'call_iria_self_assessment__s2', 'call_iria_self_assessment__s3')
GROUP  BY landmark_type, title, completed
ORDER  BY landmark_type, completed, title;
