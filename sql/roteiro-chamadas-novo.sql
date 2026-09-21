-- ============================================================================
--  Ward Academy — roteiro de chamadas por Step
--  Gerado a partir de js/roteiro-chamadas.js (fonte unica do roteiro).
--
--  O que este arquivo faz, em ordem:
--    1. guarda uma copia de seguranca da tabela landmarks;
--    2. cria a coluna que marca quem tem a sequencia de pesquisa liberada;
--    3. descobre em que prova cada aluno esta (o que ele escolheu no dashboard,
--       em "Preparacao Atual"); quem nao escolheu nada esta no Step 1;
--    4. apaga as chamadas NAO agendadas e NAO concluidas (o roteiro velho);
--    5. da a cada chamada o nome da prova a que ela pertence, e manda para
--       "Chamadas anteriores" o que e de outra prova ou nao existe mais;
--    6. cria o roteiro da prova atual para quem ainda nao o tem.
--
--  Duas naturezas de chamada:
--    - de jornada: acontece uma vez na vida do aluno (plataforma, notarycam,
--      visto) ou e uma vaga permanente de seguimento. O tipo nao muda.
--    - de prova: acontece uma vez por prova. O tipo leva o sufixo do step
--      ('' no Step 1, '__s2' no Step 2 CK, '__s3' no Step 3) e o titulo leva o
--      nome da prova. Ninguem precisa renomear nada do Step 1: ele nao tem
--      sufixo de proposito.
--
--  Roda inteiro numa transacao: ou aplica tudo, ou nao aplica nada.
--  Rode uma vez; rodar de novo nao duplica nada.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- 1) backup
-- Copia da tabela antes de qualquer mudanca. Para desfazer:
--   DELETE FROM landmarks;
--   INSERT INTO landmarks SELECT * FROM landmarks_backup_roteiro;
-- IF NOT EXISTS de proposito: se voce rodar duas vezes, o backup continua
-- sendo o do estado ORIGINAL, nao o de depois da migracao.
CREATE TABLE IF NOT EXISTS landmarks_backup_roteiro AS SELECT * FROM landmarks;

-- -------------------------------------------------- 2) liberacao de pesquisa
-- A sequencia de pesquisa deixa de vir do questionario: quem libera, aluno a
-- aluno, e o Marcos no dashboard dele.
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_enabled BOOLEAN DEFAULT FALSE;
UPDATE users SET research_enabled = FALSE WHERE research_enabled IS NULL;

-- --------------------------------------------- 3) em que prova cada aluno esta
CREATE TEMP TABLE aluno_step ON COMMIT DROP AS
SELECT u.id AS user_id,
       CASE lower(COALESCE(ups.currently_preparing_for, 'step1'))
            WHEN 'step2ck' THEN 'step2ck'
            WHEN 'step2'   THEN 'step2ck'
            WHEN 'step3'   THEN 'step3'
            ELSE 'step1'
       END AS step
FROM   users u
LEFT   JOIN user_preparation_status ups ON ups.user_id = u.id
WHERE  u.role IN ('aluno', 'assessoria');

-- ------------------------------------------------------- 4) o roteiro novo
-- Chamadas de jornada: uma vez por aluno, seja qual for a prova.
CREATE TEMP TABLE roteiro_jornada (tipo TEXT, titulo TEXT, grupo TEXT, posicao INT) ON COMMIT DROP;

INSERT INTO roteiro_jornada (tipo, titulo, grupo, posicao) VALUES
        ('call_marcos_plataforma', 'Marcos Vilela: como usar a plataforma da Ward Academy', 'imersao', 0),
        ('call_iria_caminhos', 'Iria: o que é o USMLE e quais caminhos ele abre', 'imersao', 2),
        ('call_guilherme_anki_setup', 'Guilherme: configurando o Anki do zero', 'imersao', 3),
        ('call_marcos_myintealth_conta', 'Marcos: criando a sua conta no Myintealth', 'imersao', 4),
        ('call_marcos_notarycam', 'Marcos: reconhecendo os documentos no NotaryCam', 'imersao', 5),
        ('call_iria_visto', 'Iria: como funciona o visto para os Estados Unidos', 'imersao', 8),
        ('call_iria_familia', 'Iria: conversando com a família sobre a decisão do USMLE', 'imersao', 9),
        ('call_iria_financeiro', 'Iria: planejando o lado financeiro da jornada', 'imersao', 10),
        ('call_marcos_ajuste_cronograma', 'Marcos: ajustando o seu cronograma de estudos', 'seguimento', 11),
        ('call_iria_system', 'Iria: avaliando a conclusão de um system', 'seguimento', 12),
        ('call_iria_orientacoes', 'Iria: orientações gerais sobre a sua preparação', 'seguimento', 13),
        ('call_guilherme_anki_update', 'Guilherme: atualizando e revisando o seu Anki', 'seguimento', 14);

-- Chamadas de prova: uma vez por prova, com o nome da prova no titulo.
CREATE TEMP TABLE roteiro_step (step TEXT, tipo TEXT, titulo TEXT, grupo TEXT, posicao INT) ON COMMIT DROP;

INSERT INTO roteiro_step (step, tipo, titulo, grupo, posicao) VALUES
        ('step1', 'call_iria_uworld', 'Iria da Costa: como resolver as questões do UWorld do Step 1', 'imersao', 1),
        ('step1', 'call_marcos_myintealth_final', 'Marcos: finalizando a inscrição no Myintealth para o Step 1', 'imersao', 6),
        ('step1', 'call_iria_materiais', 'Iria: quais materiais de estudo usar na preparação para o Step 1', 'imersao', 7),
        ('step1', 'call_iria_second_pass', 'Iria: planejando a segunda passada no conteúdo do Step 1', 'prova', 15),
        ('step1', 'call_iria_simulados', 'Iria: organizando os simulados do Step 1', 'prova', 16),
        ('step1', 'call_marcos_fsmb', 'Marcos: fazendo a sua inscrição no FSMB para o Step 1', 'prova', 17),
        ('step1', 'call_marcos_claude', 'Marcos: usando o Claude na preparação para o Step 1', 'prova', 18),
        ('step1', 'call_iria_materiais_reta_final', 'Iria: escolhendo os materiais de estudo da reta final do Step 1', 'prova', 19),
        ('step1', 'call_guilherme_anki_reta_final', 'Guilherme: ajustando o Anki para a reta final do Step 1', 'prova', 20),
        ('step1', 'call_iria_self_assessment', 'Iria: avaliando o seu resultado no self assessment do Step 1', 'prova', 21),
        ('step1', 'call_marcos_eligibility', 'Marcos: marcando o eligibility period do Step 1 no FSMB', 'prova', 22),
        ('step1', 'call_marcos_preditivos', 'Marcos: organizando os materiais preditivos do Step 1 que você já fez', 'prova', 23),
        ('step1', 'call_iria_predicao', 'Iria: avaliando a predição e definindo a data da prova do Step 1', 'prova', 24),
        ('step1', 'call_marcos_prometric', 'Marcos: agendando a sua prova do Step 1 no Prometric', 'prova', 25),
        ('step1', 'call_iria_predicao_check', 'Iria: checando se a predição permite marcar a prova do Step 1', 'prova', 26),
        ('step1', 'call_iria_pre_prova', 'Iria: conversa de preparação para o dia da prova do Step 1', 'prova', 27),
        ('step2ck', 'call_iria_uworld__s2', 'Iria da Costa: como resolver as questões do UWorld do Step 2 CK', 'imersao', 1),
        ('step2ck', 'call_marcos_myintealth_final__s2', 'Marcos: finalizando a inscrição no Myintealth para o Step 2 CK', 'imersao', 6),
        ('step2ck', 'call_iria_materiais__s2', 'Iria: quais materiais de estudo usar na preparação para o Step 2 CK', 'imersao', 7),
        ('step2ck', 'call_iria_second_pass__s2', 'Iria: planejando a segunda passada no conteúdo do Step 2 CK', 'prova', 15),
        ('step2ck', 'call_iria_simulados__s2', 'Iria: organizando os simulados do Step 2 CK', 'prova', 16),
        ('step2ck', 'call_marcos_fsmb__s2', 'Marcos: fazendo a sua inscrição no FSMB para o Step 2 CK', 'prova', 17),
        ('step2ck', 'call_marcos_claude__s2', 'Marcos: usando o Claude na preparação para o Step 2 CK', 'prova', 18),
        ('step2ck', 'call_iria_materiais_reta_final__s2', 'Iria: escolhendo os materiais de estudo da reta final do Step 2 CK', 'prova', 19),
        ('step2ck', 'call_guilherme_anki_reta_final__s2', 'Guilherme: ajustando o Anki para a reta final do Step 2 CK', 'prova', 20),
        ('step2ck', 'call_iria_self_assessment__s2', 'Iria: avaliando o seu resultado no self assessment do Step 2 CK', 'prova', 21),
        ('step2ck', 'call_marcos_eligibility__s2', 'Marcos: marcando o eligibility period do Step 2 CK no FSMB', 'prova', 22),
        ('step2ck', 'call_marcos_preditivos__s2', 'Marcos: organizando os materiais preditivos do Step 2 CK que você já fez', 'prova', 23),
        ('step2ck', 'call_iria_predicao__s2', 'Iria: avaliando a predição e definindo a data da prova do Step 2 CK', 'prova', 24),
        ('step2ck', 'call_marcos_prometric__s2', 'Marcos: agendando a sua prova do Step 2 CK no Prometric', 'prova', 25),
        ('step2ck', 'call_iria_predicao_check__s2', 'Iria: checando se a predição permite marcar a prova do Step 2 CK', 'prova', 26),
        ('step2ck', 'call_iria_pre_prova__s2', 'Iria: conversa de preparação para o dia da prova do Step 2 CK', 'prova', 27),
        ('step3', 'call_iria_uworld__s3', 'Iria da Costa: como resolver as questões do UWorld do Step 3', 'imersao', 1),
        ('step3', 'call_iria_materiais__s3', 'Iria: quais materiais de estudo usar na preparação para o Step 3', 'imersao', 7),
        ('step3', 'call_iria_second_pass__s3', 'Iria: planejando a segunda passada no conteúdo do Step 3', 'prova', 15),
        ('step3', 'call_iria_simulados__s3', 'Iria: organizando os simulados do Step 3', 'prova', 16),
        ('step3', 'call_marcos_fsmb__s3', 'Marcos: fazendo a sua inscrição no FSMB para o Step 3', 'prova', 17),
        ('step3', 'call_marcos_claude__s3', 'Marcos: usando o Claude na preparação para o Step 3', 'prova', 18),
        ('step3', 'call_iria_materiais_reta_final__s3', 'Iria: escolhendo os materiais de estudo da reta final do Step 3', 'prova', 19),
        ('step3', 'call_guilherme_anki_reta_final__s3', 'Guilherme: ajustando o Anki para a reta final do Step 3', 'prova', 20),
        ('step3', 'call_iria_self_assessment__s3', 'Iria: avaliando o seu resultado no self assessment do Step 3', 'prova', 21),
        ('step3', 'call_marcos_eligibility__s3', 'Marcos: marcando o eligibility period do Step 3 no FSMB', 'prova', 22),
        ('step3', 'call_marcos_preditivos__s3', 'Marcos: organizando os materiais preditivos do Step 3 que você já fez', 'prova', 23),
        ('step3', 'call_iria_predicao__s3', 'Iria: avaliando a predição e definindo a data da prova do Step 3', 'prova', 24),
        ('step3', 'call_marcos_prometric__s3', 'Marcos: agendando a sua prova do Step 3 no Prometric', 'prova', 25),
        ('step3', 'call_iria_predicao_check__s3', 'Iria: checando se a predição permite marcar a prova do Step 3', 'prova', 26),
        ('step3', 'call_iria_pre_prova__s3', 'Iria: conversa de preparação para o dia da prova do Step 3', 'prova', 27);

-- Pesquisa e Dr. Fernando ficam FORA do roteiro padrao: entram so para quem
-- estiver marcado, e nao dependem da prova.
CREATE TEMP TABLE roteiro_opcional (tipo TEXT, titulo TEXT, grupo TEXT, posicao INT) ON COMMIT DROP;

INSERT INTO roteiro_opcional (tipo, titulo, grupo, posicao) VALUES
        ('call_marcos_pesquisa_onboarding', 'Marcos: primeiros passos na pesquisa científica', 'pesquisa', 100),
        ('call_marcos_pesquisa_ideia', 'Marcos: validando a ideia da sua pesquisa', 'pesquisa', 101),
        ('call_marcos_pesquisa_databases', 'Marcos: usando as databases corretamente na busca', 'pesquisa', 102),
        ('call_marcos_pesquisa_triagem_titulo', 'Marcos: fazendo a triagem por título e resumo', 'pesquisa', 103),
        ('call_marcos_pesquisa_triagem_manuscrito', 'Marcos: fazendo a triagem por manuscrito completo', 'pesquisa', 104),
        ('call_marcos_pesquisa_extracao', 'Marcos: extraindo os dados dos estudos', 'pesquisa', 105),
        ('call_marcos_pesquisa_vies', 'Marcos: avaliando o risco de viés dos estudos', 'pesquisa', 106),
        ('call_marcos_pesquisa_escrita', 'Marcos: escrevendo o manuscrito do seu artigo', 'pesquisa', 107),
        ('call_marcos_pesquisa_submissao', 'Marcos: submetendo o manuscrito para a revista', 'pesquisa', 108),
        ('call_fernando_research', 'Fernando: mentoria em pesquisa científica', 'fernando', 200);

-- Tudo que o roteiro conhece, num lugar so (para separar o que e historico).
CREATE TEMP VIEW roteiro_todos AS
SELECT tipo, titulo, grupo FROM roteiro_jornada
UNION ALL SELECT tipo, titulo, grupo FROM roteiro_step
UNION ALL SELECT tipo, titulo, grupo FROM roteiro_opcional;

-- --------------------------------------- 5) apaga as chamadas nao agendadas
-- Sai: o que esta pendente, sem agendamento nenhum e sem observacao.
-- Fica: tudo que ja foi agendado (mesmo cancelado), concluido, ou tem
--       observacao de mentor — isso e historico do aluno. As chamadas extras
--       que o proprio aluno criou tambem ficam: nao sao roteiro, sao dele.
DELETE FROM landmarks lm
WHERE  lm.completed IS NOT TRUE
  AND  lm.landmark_type NOT LIKE 'call_extra_%'
  AND  NOT EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = lm.id)
  AND  COALESCE(jsonb_array_length(COALESCE(lm.notes, '[]'::jsonb)), 0) = 0;

-- ------------------------------- 6) arruma o que sobrou do roteiro antigo
-- Todo mundo recebe o titulo do seu proprio tipo — inclusive as chamadas de
-- uma prova que o aluno ja passou, que ficam com o nome daquela prova.
UPDATE landmarks lm
SET    title = r.titulo, updated_at = NOW()
FROM   roteiro_todos r
WHERE  lm.landmark_type = r.tipo
  AND  lm.title IS DISTINCT FROM r.titulo;

-- Ocorrencias de chamadas repetiveis ("<chamada> — Cardiologia") acompanham o
-- nome novo, preservando o assunto que o aluno escreveu.
UPDATE landmarks lm
SET    title = r.titulo || ' — ' || substring(lm.title from position(' — ' in lm.title) + 3),
       updated_at = NOW()
FROM   roteiro_todos r
WHERE  lm.landmark_type = r.tipo || '__oc'
  AND  position(' — ' in lm.title) > 0
  AND  lm.title NOT LIKE r.titulo || ' — %';

-- Grupo e ordem: chamadas de jornada e chamadas da prova ATUAL do aluno ficam
-- nos grupos do roteiro.
UPDATE landmarks lm
SET    group_name = r.grupo, order_position = r.posicao, updated_at = NOW()
FROM   roteiro_jornada r
WHERE  lm.landmark_type IN (r.tipo, r.tipo || '__oc')
  AND  (lm.group_name IS DISTINCT FROM r.grupo OR lm.order_position IS DISTINCT FROM r.posicao);

UPDATE landmarks lm
SET    group_name = r.grupo, order_position = r.posicao, updated_at = NOW()
FROM   roteiro_step r, aluno_step a
WHERE  lm.user_id = a.user_id
  AND  r.step = a.step
  AND  lm.landmark_type IN (r.tipo, r.tipo || '__oc')
  AND  (lm.group_name IS DISTINCT FROM r.grupo OR lm.order_position IS DISTINCT FROM r.posicao);

UPDATE landmarks lm
SET    group_name = r.grupo, order_position = r.posicao, updated_at = NOW()
FROM   roteiro_opcional r
WHERE  lm.landmark_type IN (r.tipo, r.tipo || '__oc')
  AND  (lm.group_name IS DISTINCT FROM r.grupo OR lm.order_position IS DISTINCT FROM r.posicao);

-- Chamadas de uma prova que o aluno ja passou vao para "Chamadas anteriores",
-- no fim da pagina — continuam visiveis, com o historico, sem atrapalhar.
UPDATE landmarks lm
SET    group_name = 'historico', updated_at = NOW()
FROM   roteiro_step r, aluno_step a
WHERE  lm.user_id = a.user_id
  AND  r.step <> a.step
  AND  lm.landmark_type IN (r.tipo, r.tipo || '__oc')
  AND  COALESCE(lm.group_name, '') IS DISTINCT FROM 'historico';

-- O que nao existe mais em roteiro nenhum tambem vai para "Chamadas anteriores".
UPDATE landmarks lm
SET    group_name = 'historico', updated_at = NOW()
WHERE  lm.landmark_type NOT IN (SELECT tipo FROM roteiro_todos)
  AND  lm.landmark_type NOT LIKE 'call_extra_%'
  AND  lm.landmark_type NOT LIKE '%__oc'
  AND  COALESCE(lm.group_name, '') IS DISTINCT FROM 'historico';

-- -------------------------------- 7) cria o roteiro novo para cada aluno
-- Chamadas de jornada: para todo mundo.
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT a.user_id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   aluno_step a
CROSS  JOIN roteiro_jornada r
WHERE  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = a.user_id AND lm.landmark_type = r.tipo
       );

-- Chamadas da prova atual de cada aluno.
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT a.user_id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   aluno_step a
JOIN   roteiro_step r ON r.step = a.step
WHERE  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = a.user_id AND lm.landmark_type = r.tipo
       );

-- Sequencia de pesquisa: so para quem o Marcos ja liberou.
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT a.user_id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   aluno_step a
JOIN   users u ON u.id = a.user_id
CROSS  JOIN roteiro_opcional r
WHERE  r.grupo = 'pesquisa'
  AND  u.research_enabled IS TRUE
  AND  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = a.user_id AND lm.landmark_type = r.tipo
       );

-- Chamada com o Dr. Fernando: so para quem esta marcado como aluno dele.
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT a.user_id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   aluno_step a
JOIN   users u ON u.id = a.user_id
CROSS  JOIN roteiro_opcional r
WHERE  r.grupo = 'fernando'
  AND  u.fernando_interested IS TRUE
  AND  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = a.user_id AND lm.landmark_type = r.tipo
       );

COMMIT;

-- ============================================================================
--  Conferencia — rode esta parte depois e confira os numeros.
-- ============================================================================
SELECT 'antes (backup)'        AS momento, COUNT(*) AS chamadas FROM landmarks_backup_roteiro
UNION ALL
SELECT 'agora'                 AS momento, COUNT(*) FROM landmarks
UNION ALL
SELECT 'no roteiro da prova'   AS momento, COUNT(*) FROM landmarks WHERE group_name IN ('imersao','seguimento','prova')
UNION ALL
SELECT 'pesquisa liberada'     AS momento, COUNT(*) FROM landmarks WHERE group_name = 'pesquisa'
UNION ALL
SELECT 'chamada do Fernando'   AS momento, COUNT(*) FROM landmarks WHERE group_name = 'fernando'
UNION ALL
SELECT 'chamadas anteriores'   AS momento, COUNT(*) FROM landmarks WHERE group_name = 'historico'
UNION ALL
SELECT 'chamadas extras'       AS momento, COUNT(*) FROM landmarks WHERE group_name = 'extras'
UNION ALL
SELECT 'alunos alcancados'     AS momento, COUNT(DISTINCT user_id) FROM landmarks WHERE group_name = 'imersao';
