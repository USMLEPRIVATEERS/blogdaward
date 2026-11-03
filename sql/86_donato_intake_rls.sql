-- ============================================================================
--  Ward Academy - corrige o formulario do Dr. Andre (Fellow e Alternate)
--
--  Erro que os alunos viam ao salvar:
--    "new row violates row-level security policy for table donato_intake"
--
--  O sql/82 criou a tabela com RLS LIGADO e NENHUMA politica: o banco recusava
--  tudo que vinha da API, gravar e ler (a ficha nem aparecia para o Dr. Andre).
--
--  Quem controla o acesso a esta tabela e a API (api/data/query.js): o aluno
--  so le e grava a propria linha, o Dr. Andre so ve os alunos liberados, e a
--  chave do banco so existe no servidor. Mesmo padrao das outras tabelas
--  (ex.: sql/80): uma politica que deixa a API passar.
--
--  Pode rodar mais de uma vez.
-- ============================================================================

DROP POLICY IF EXISTS donato_intake_api ON donato_intake;
CREATE POLICY donato_intake_api ON donato_intake
    FOR ALL USING (true) WITH CHECK (true);

-- Conferencia: deve aparecer 1 linha, donato_intake_api
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'donato_intake';
