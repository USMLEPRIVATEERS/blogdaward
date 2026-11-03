-- ============================================================================
--  Monitor de alunos -> WhatsApp: as tres consultas (somente leitura)
--
--  $1 = "desde": a ultima verificacao MENOS 5 minutos de folga (o script
--       guarda os ids ja avisados, entao a folga nao repete aviso).
--  $2 = minimo de questoes para contar a sessao (1 = qualquer sessao).
--
--  Nomes (users.full_name) podem vir CIFRADOS: passe por decifrar_nome()
--  antes de usar (ver decifrar_nome.py / README.md).
-- ============================================================================

-- 1) CHAMADAS MARCADAS --------------------------------------------------------
--    Cada agendamento e uma linha nova em scheduled_calls (reagendar apaga a
--    linha antiga e cria outra, entao reagendamento tambem aparece aqui).
--    scheduled_date/scheduled_time estao no fuso do MENTOR (mentor_fuso);
--    student_timezone e o fuso do aluno.
SELECT sc.id,
       sc.created_at,                       -- quando o aluno marcou (UTC)
       sc.scheduled_date,
       sc.scheduled_time,
       sc.student_timezone,
       sc.notes,                            -- resposta do aluno (ex.: "NBME 28")
       a.full_name                          AS aluno_nome,
       m.full_name                          AS mentor_nome,
       COALESCE(m.timezone, 'America/Sao_Paulo') AS mentor_fuso,
       COALESCE(l.title, 'Call com mentor') AS chamada
FROM   scheduled_calls sc
JOIN   users a ON a.id = sc.student_id
JOIN   users m ON m.id = sc.mentor_id
LEFT JOIN landmarks l ON l.id = sc.landmark_id
WHERE  sc.created_at > $1
  AND  sc.status = 'scheduled'
  AND  a.role IN ('aluno', 'assessoria')
ORDER  BY sc.created_at;

-- 2) CHECK-INS COM TEXTO, PEDINDO AJUDA OU COM UWORLD <= 40% ------------------
--    A linha do dia ja existe desde as 3h (filled NULL) e e PREENCHIDA quando
--    o aluno responde: created_at NAO e a hora da resposta e nao ha
--    updated_at. Por isso esta consulta nao usa $1: olha os ultimos 2 dias e o
--    script avisa so o que ainda nao avisou (chave = id + conteudo).
--    filled: NULL = ainda nao respondeu, 0 = pulou, 1 = respondeu.
SELECT c.id,
       c.date,
       c.status,                            -- tranquilo | preciso_ajuda | parado | custom
       c.message,
       c.uworld_questions_done,
       c.uworld_correct_answers,
       c.anki_cards_today,
       c.anki_current_streak,
       u.full_name AS aluno_nome
FROM   daily_checkins c
JOIN   users u ON u.id = c.user_id
WHERE  c.filled = 1
  AND  c.date >= CURRENT_DATE - 2
  AND  u.role IN ('aluno', 'assessoria')
  AND  (   c.status IN ('preciso_ajuda', 'parado')
        OR NULLIF(btrim(c.message), '') IS NOT NULL
        OR (c.uworld_questions_done >= GREATEST($2, 1)
            AND c.uworld_correct_answers * 100.0 / c.uworld_questions_done <= 40))
ORDER  BY c.date, c.id;

-- 3) SESSOES DE QUESTOES (UWORLD) COM <= 40% ----------------------------------
--    Gravadas pelo Diario UWorld e pelo "Registrar sessao" do Cronograma.
SELECT d.id,
       d.created_at,
       d.date,
       d.total_questions,
       d.correct_answers,
       d.exam_type,
       d.subject,
       d.system,
       d.category,
       d.notes,
       u.full_name AS aluno_nome
FROM   uworld_diary d
JOIN   users u ON u.id = d.user_id
WHERE  d.created_at > $1
  AND  d.total_questions >= GREATEST($2, 1)
  AND  d.correct_answers * 100.0 / d.total_questions <= 40
  AND  u.role IN ('aluno', 'assessoria')
ORDER  BY d.created_at;
