-- ============================================================================
--  Ward Academy — novo roteiro de chamadas
--  Gerado a partir de js/roteiro-chamadas.js (fonte unica do roteiro).
--
--  O que este arquivo faz, em ordem:
--    1. guarda uma copia de seguranca da tabela landmarks;
--    2. cria a coluna que marca quem tem a sequencia de pesquisa liberada;
--    3. apaga as chamadas NAO agendadas e NAO concluidas (o roteiro velho);
--    4. preserva o que ja foi agendado, concluido ou tem observacao, e manda
--       para o grupo "historico" o que nao existe mais no roteiro novo;
--    5. cria o roteiro novo para todos os alunos que ainda nao o tem.
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

-- ------------------------------------------------------- 3) o roteiro novo
CREATE TEMP TABLE roteiro_novo (tipo TEXT, titulo TEXT, grupo TEXT, posicao INT) ON COMMIT DROP;

INSERT INTO roteiro_novo (tipo, titulo, grupo, posicao) VALUES
        ('call_marcos_plataforma', 'Marcos Vilela: como usar a plataforma da Ward Academy', 'imersao', 0),
        ('call_iria_uworld', 'Iria da Costa: como resolver as questões do UWorld', 'imersao', 1),
        ('call_iria_caminhos', 'Iria: o que é o USMLE e quais caminhos ele abre', 'imersao', 2),
        ('call_guilherme_anki_setup', 'Guilherme: configurando o Anki do zero', 'imersao', 3),
        ('call_marcos_myintealth_conta', 'Marcos: criando a sua conta no Myintealth', 'imersao', 4),
        ('call_marcos_notarycam', 'Marcos: reconhecendo os documentos no NotaryCam', 'imersao', 5),
        ('call_marcos_myintealth_final', 'Marcos: finalizando a inscrição no Myintealth', 'imersao', 6),
        ('call_iria_materiais', 'Iria: quais materiais de estudo usar na preparação', 'imersao', 7),
        ('call_iria_visto', 'Iria: como funciona o visto para os Estados Unidos', 'imersao', 8),
        ('call_iria_familia', 'Iria: conversando com a família sobre a decisão do USMLE', 'imersao', 9),
        ('call_iria_financeiro', 'Iria: planejando o lado financeiro da jornada', 'imersao', 10),
        ('call_marcos_ajuste_cronograma', 'Marcos: ajustando o seu cronograma de estudos', 'seguimento', 11),
        ('call_iria_system', 'Iria: avaliando a conclusão de um system', 'seguimento', 12),
        ('call_iria_orientacoes', 'Iria: orientações gerais sobre a sua preparação', 'seguimento', 13),
        ('call_guilherme_anki_update', 'Guilherme: atualizando e revisando o seu Anki', 'seguimento', 14),
        ('call_iria_second_pass', 'Iria: planejando a segunda passada no conteúdo', 'prova', 15),
        ('call_iria_simulados', 'Iria: organizando os simulados até a prova', 'prova', 16),
        ('call_marcos_fsmb', 'Marcos: fazendo a sua inscrição no FSMB', 'prova', 17),
        ('call_marcos_claude', 'Marcos: usando o Claude na preparação para o Step 1', 'prova', 18),
        ('call_iria_materiais_reta_final', 'Iria: escolhendo os materiais de estudo da reta final', 'prova', 19),
        ('call_guilherme_anki_reta_final', 'Guilherme: ajustando o Anki para a reta final', 'prova', 20),
        ('call_iria_self_assessment', 'Iria: avaliando o seu resultado no self assessment', 'prova', 21),
        ('call_marcos_eligibility', 'Marcos: marcando o eligibility period no FSMB', 'prova', 22),
        ('call_marcos_preditivos', 'Marcos: organizando os materiais preditivos já realizados', 'prova', 23),
        ('call_iria_predicao', 'Iria: avaliando a predição e definindo a data da prova', 'prova', 24),
        ('call_marcos_prometric', 'Marcos: agendando a sua prova no Prometric', 'prova', 25),
        ('call_iria_predicao_check', 'Iria: checando se a predição permite marcar a prova', 'prova', 26),
        ('call_iria_pre_prova', 'Iria: conversa de preparação para o dia da prova', 'prova', 27);

-- Pesquisa e Dr. Fernando ficam FORA do roteiro padrao: entram so para quem
-- estiver marcado. Ficam numa tabela separada.
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

-- --------------------------------------- 4) apaga as chamadas nao agendadas
-- Sai: o que esta pendente, sem agendamento nenhum e sem observacao.
-- Fica: tudo que ja foi agendado (mesmo cancelado), concluido, ou tem
--       observacao de mentor — isso e historico do aluno. As chamadas extras
--       que o proprio aluno criou tambem ficam: nao sao roteiro, sao dele.
DELETE FROM landmarks lm
WHERE  lm.completed IS NOT TRUE
  AND  lm.landmark_type NOT LIKE 'call_extra_%'
  AND  NOT EXISTS (SELECT 1 FROM scheduled_calls sc WHERE sc.landmark_id = lm.id)
  AND  COALESCE(jsonb_array_length(COALESCE(lm.notes, '[]'::jsonb)), 0) = 0;

-- ------------------------------- 5) arruma o que sobrou do roteiro antigo
-- Chamadas que continuam existindo no roteiro novo: recebem o nome e o grupo
-- novos (sem numero, sem duracao).
UPDATE landmarks lm
SET    title = r.titulo,
       group_name = r.grupo,
       order_position = r.posicao,
       updated_at = NOW()
FROM   roteiro_novo r
WHERE  lm.landmark_type = r.tipo
  AND  (lm.title IS DISTINCT FROM r.titulo OR lm.group_name IS DISTINCT FROM r.grupo);

UPDATE landmarks lm
SET    title = r.titulo,
       group_name = r.grupo,
       order_position = r.posicao,
       updated_at = NOW()
FROM   roteiro_opcional r
WHERE  lm.landmark_type = r.tipo
  AND  (lm.title IS DISTINCT FROM r.titulo OR lm.group_name IS DISTINCT FROM r.grupo);

-- Ocorrencias de chamadas repetiveis ("<chamada> — Cardiologia") passam a usar
-- o nome novo da chamada, preservando o assunto que o aluno escreveu.
UPDATE landmarks lm
SET    title = r.titulo || ' — ' || substring(lm.title from position(' — ' in lm.title) + 3),
       group_name = r.grupo,
       updated_at = NOW()
FROM   roteiro_novo r
WHERE  lm.landmark_type = r.tipo || '__oc'
  AND  position(' — ' in lm.title) > 0
  AND  lm.title NOT LIKE r.titulo || ' — %';

-- O que nao existe mais no roteiro novo vai para "Chamadas anteriores", no fim
-- da pagina do aluno — continua visivel, sem atrapalhar.
UPDATE landmarks lm
SET    group_name = 'historico',
       updated_at = NOW()
WHERE  lm.landmark_type NOT IN (SELECT tipo FROM roteiro_novo)
  AND  lm.landmark_type NOT IN (SELECT tipo FROM roteiro_opcional)
  AND  lm.landmark_type NOT LIKE 'call_extra_%'
  AND  lm.landmark_type NOT LIKE '%__oc'
  AND  COALESCE(lm.group_name, '') IS DISTINCT FROM 'historico';

-- -------------------------------- 6) cria o roteiro novo para cada aluno
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT u.id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   users u
CROSS  JOIN roteiro_novo r
WHERE  u.role IN ('aluno', 'assessoria')
  AND  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = u.id AND lm.landmark_type = r.tipo
       );

-- Sequencia de pesquisa: so para quem o Marcos ja liberou.
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT u.id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   users u
CROSS  JOIN roteiro_opcional r
WHERE  u.role IN ('aluno', 'assessoria')
  AND  r.grupo = 'pesquisa'
  AND  u.research_enabled IS TRUE
  AND  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = u.id AND lm.landmark_type = r.tipo
       );

-- Chamada com o Dr. Fernando: so para quem esta marcado como aluno dele.
INSERT INTO landmarks (user_id, landmark_type, title, completed, is_urgent, notes, order_position, group_name)
SELECT u.id, r.tipo, r.titulo, FALSE, FALSE, '[]'::jsonb, r.posicao, r.grupo
FROM   users u
CROSS  JOIN roteiro_opcional r
WHERE  u.role IN ('aluno', 'assessoria')
  AND  r.grupo = 'fernando'
  AND  u.fernando_interested IS TRUE
  AND  NOT EXISTS (
         SELECT 1 FROM landmarks lm
         WHERE  lm.user_id = u.id AND lm.landmark_type = r.tipo
       );

COMMIT;

-- ============================================================================
--  Conferencia — rode esta parte depois e confira os numeros.
-- ============================================================================
SELECT 'antes (backup)'        AS momento, COUNT(*) AS chamadas FROM landmarks_backup_roteiro
UNION ALL
SELECT 'agora'                 AS momento, COUNT(*) FROM landmarks
UNION ALL
SELECT 'no roteiro novo'       AS momento, COUNT(*) FROM landmarks WHERE group_name IN ('imersao','seguimento','prova')
UNION ALL
SELECT 'pesquisa liberada'     AS momento, COUNT(*) FROM landmarks WHERE group_name = 'pesquisa'
UNION ALL
SELECT 'chamada do Fernando'   AS momento, COUNT(*) FROM landmarks WHERE group_name = 'fernando'
UNION ALL
SELECT 'historico preservado'  AS momento, COUNT(*) FROM landmarks WHERE group_name = 'historico'
UNION ALL
SELECT 'chamadas extras'       AS momento, COUNT(*) FROM landmarks WHERE group_name = 'extras'
UNION ALL
SELECT 'alunos alcancados'     AS momento, COUNT(DISTINCT user_id) FROM landmarks WHERE group_name = 'imersao';
