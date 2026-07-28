-- =============================================
-- DIAGNÓSTICO — sincronização das "questões já usadas" (Criar Teste)
--
-- Rode inteiro no SQL editor do Supabase. Não altera nada: só lê e relata.
-- O resultado sai numa tabela única com uma linha por verificação.
-- =============================================

DO $diag$
DECLARE
  v_existe  boolean := to_regclass('public.qbank_used_questions') IS NOT NULL;
  v_cols    int := 0;
  v_uniq    int := 0;
  v_rls     boolean := false;
  v_linhas  bigint := 0;
  v_alunos  bigint := 0;
  v_ultima  text := '-';
  v_grants  text;
  r         record;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _diag(ordem int, verificacao text, resultado text, situacao text);
  DELETE FROM _diag;

  INSERT INTO _diag VALUES (1, 'Tabela qbank_used_questions existe',
    CASE WHEN v_existe THEN 'sim' ELSE 'NÃO' END,
    CASE WHEN v_existe THEN '✅ OK' ELSE '❌ FALHA — rode sql/qbank-used-questions.sql' END);

  IF NOT v_existe THEN
    INSERT INTO _diag VALUES (2, 'Demais verificações', 'puladas', 'a tabela precisa existir primeiro');
    RETURN;
  END IF;

  -- colunas esperadas
  SELECT count(*) INTO v_cols FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'qbank_used_questions'
     AND column_name IN ('id','user_id','bank','step','done_ids','removed_ids','updated_at');
  INSERT INTO _diag VALUES (2, 'Colunas esperadas presentes (de 7)', v_cols::text,
    CASE WHEN v_cols = 7 THEN '✅ OK' ELSE '❌ FALHA — faltam colunas' END);

  -- a restrição UNIQUE é o que faz o upsert funcionar
  SELECT count(*) INTO v_uniq FROM pg_constraint
   WHERE conrelid = 'public.qbank_used_questions'::regclass AND contype = 'u';
  INSERT INTO _diag VALUES (3, 'Restrição UNIQUE (user_id, bank, step)', v_uniq::text,
    CASE WHEN v_uniq >= 1 THEN '✅ OK'
         ELSE '❌ FALHA — sem ela o app não consegue gravar (upsert)' END);

  -- permissões (o app grava via service_role)
  SELECT string_agg(DISTINCT grantee, ', ') INTO v_grants
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public' AND table_name = 'qbank_used_questions'
     AND privilege_type = 'SELECT';
  INSERT INTO _diag VALUES (4, 'GRANT de leitura concedido a', coalesce(v_grants, '(nenhum)'),
    CASE WHEN coalesce(v_grants,'') LIKE '%service_role%' THEN '✅ OK'
         ELSE '❌ FALHA — falta GRANT para service_role' END);

  SELECT relrowsecurity INTO v_rls FROM pg_class
   WHERE oid = 'public.qbank_used_questions'::regclass;
  INSERT INTO _diag VALUES (5, 'RLS habilitada',
    CASE WHEN v_rls THEN 'sim' ELSE 'não' END,
    'ℹ️ informativo — o app acessa via service_role, que ignora RLS');

  -- dados realmente gravados
  SELECT count(*), count(DISTINCT user_id), coalesce(max(updated_at)::text, '-')
    INTO v_linhas, v_alunos, v_ultima
    FROM public.qbank_used_questions;

  INSERT INTO _diag VALUES (6, 'Linhas gravadas', v_linhas::text,
    CASE WHEN v_linhas > 0 THEN '✅ o app já gravou aqui'
         ELSE '⚠️ nada gravado ainda — a tabela está pronta, mas nenhuma lista chegou' END);
  INSERT INTO _diag VALUES (7, 'Alunos com lista salva', v_alunos::text, 'ℹ️');
  INSERT INTO _diag VALUES (8, 'Gravação mais recente', v_ultima, 'ℹ️');

  -- detalhe das últimas linhas
  FOR r IN
    SELECT u.user_id, u.bank, u.step,
           coalesce(array_length(u.done_ids, 1), 0)    AS feitas,
           coalesce(array_length(u.removed_ids, 1), 0) AS removidas,
           u.updated_at
      FROM public.qbank_used_questions u
     ORDER BY u.updated_at DESC
     LIMIT 20
  LOOP
    INSERT INTO _diag VALUES (100, 'linha salva',
      format('aluno %s · %s · %s · %s feitas, %s removidas', r.user_id, r.bank, r.step, r.feitas, r.removidas),
      to_char(r.updated_at, 'DD/MM/YYYY HH24:MI'));
  END LOOP;
END
$diag$;

SELECT verificacao AS "Verificação",
       resultado   AS "Resultado",
       situacao    AS "Situação"
  FROM _diag
 ORDER BY ordem, resultado;
