-- =====================================================================
-- WARD ACADEMY — Progressão dos Alunos: liberar acesso do app às tabelas
-- Rode ISTO se a página mostrar o aviso "o app não conseguiu acessar as
-- tabelas (permissão/RLS)". Garante que os papéis anon/authenticated leiam
-- e gravem nas 4 tabelas. Idempotente.
-- =====================================================================

ALTER TABLE ward_assessments          DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_assessment_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_bureaucracy       DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_ecfmg_contacts    DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    ward_assessments,
    student_assessment_scores,
    student_bureaucracy,
    faculty_ecfmg_contacts
    TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
