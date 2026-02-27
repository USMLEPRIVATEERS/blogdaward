-- ============================================
-- FLASH QUESTIONS - DISABLE RLS
-- ============================================
-- Ward Academy usa autenticação customizada (localStorage)
-- não Supabase Auth, então desabilitamos RLS
-- Execute este script no Supabase SQL Editor

-- Desabilitar RLS em todas as tabelas
ALTER TABLE flash_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE flash_question_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE flash_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE flash_question_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE flash_question_stats DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Anyone can read questions" ON flash_questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON flash_questions;
DROP POLICY IF EXISTS "Admins can update questions" ON flash_questions;

DROP POLICY IF EXISTS "Users can read all responses" ON flash_question_responses;
DROP POLICY IF EXISTS "Users can insert responses" ON flash_question_responses;
DROP POLICY IF EXISTS "Users can read own responses" ON flash_question_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON flash_question_responses;

DROP POLICY IF EXISTS "Users can read tests" ON flash_tests;
DROP POLICY IF EXISTS "Users can insert tests" ON flash_tests;
DROP POLICY IF EXISTS "Users can update tests" ON flash_tests;
DROP POLICY IF EXISTS "Users can read own tests" ON flash_tests;
DROP POLICY IF EXISTS "Users can insert own tests" ON flash_tests;
DROP POLICY IF EXISTS "Users can update own tests" ON flash_tests;

DROP POLICY IF EXISTS "Anyone can read comments" ON flash_question_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON flash_question_comments;
DROP POLICY IF EXISTS "Users can update comments" ON flash_question_comments;
DROP POLICY IF EXISTS "Users can delete comments" ON flash_question_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON flash_question_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON flash_question_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON flash_question_comments;

DROP POLICY IF EXISTS "Anyone can read stats" ON flash_question_stats;

-- ============================================
-- CONCLUÍDO!
-- ============================================
-- RLS desabilitado. As tabelas agora aceitam qualquer acesso.
-- A autenticação é gerenciada pela aplicação via localStorage.
