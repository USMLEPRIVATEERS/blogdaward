-- ============================================
-- Atualização: Novos campos no Step 2 do Questionário
-- ============================================

-- NOTA: A tabela questionnaire_data usa JSONB para armazenar dados,
-- então não precisamos alterar a estrutura da tabela.
-- Este arquivo documenta a nova estrutura de dados do Step 2.

-- Step 2 agora inclui os seguintes campos adicionais:
-- {
--   pathway: string,
--   has_visa: boolean,
--   visa_type: string,
--   current_stage: string,
--   next_exam: string,
--   next_exam_date: string,
--   first_pass_months: number,
--   second_pass_months: number,
--   dedicated_months: number,
--
--   -- NOVOS CAMPOS:
--   no_study_days: string[],  -- Array com dias que NÃO quer estudar
--                              -- Valores possíveis: 'sunday', 'monday', 'tuesday',
--                              -- 'wednesday', 'thursday', 'friday', 'saturday'
--
--   break_periods: object[]   -- Array de períodos de pausa
--                             -- Cada objeto tem: { start_date, end_date, reason }
-- }

-- Exemplo de dados completos do Step 2:
-- {
--   "pathway": "traditional",
--   "has_visa": false,
--   "visa_type": "",
--   "current_stage": "starting",
--   "next_exam": "step1",
--   "next_exam_date": "2026-06-15",
--   "first_pass_months": 10,
--   "second_pass_months": 2,
--   "dedicated_months": 1,
--   "no_study_days": ["sunday", "saturday"],
--   "break_periods": [
--     {
--       "start_date": "2026-03-01",
--       "end_date": "2026-03-10",
--       "reason": "Viagem em família"
--     },
--     {
--       "start_date": "2026-05-20",
--       "end_date": "2026-05-25",
--       "reason": "Congresso de cirurgia"
--     }
--   ]
-- }

COMMENT ON TABLE questionnaire_data IS
'Armazena dados dos questionários em formato JSONB.
Step 2 inclui informações sobre planejamento de estudos,
dias de descanso e períodos de pausa.';
