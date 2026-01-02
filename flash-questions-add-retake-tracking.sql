-- ============================================
-- FLASH QUESTIONS - ADD RETAKE TRACKING
-- ============================================
-- Adiciona campo para rastrear quando um teste é um retake de outro
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna retake_of_test_id
ALTER TABLE flash_tests
ADD COLUMN IF NOT EXISTS retake_of_test_id BIGINT REFERENCES flash_tests(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_flash_tests_retake_of ON flash_tests(retake_of_test_id);

-- ============================================
-- CONCLUÍDO!
-- ============================================
-- Agora os testes podem rastrear qual teste original estão refazendo
