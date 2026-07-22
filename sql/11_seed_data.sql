-- =============================================
-- WARD ACADEMY - DADOS INICIAIS (SEED)
-- Execute este arquivo por ULTIMO
-- =============================================

-- =============================================
-- USUARIOS MENTORES
-- =============================================

-- Inserir os 4 mentores principais
-- IMPORTANTE: Troque as senhas depois do primeiro login!
INSERT INTO users (email, password_hash, full_name, role, first_login_completed) VALUES
    ('marcosantoniodv@gmail.com', 'ward2024', 'Marcos Antonio Dias Vilela', 'mentor_marcos', TRUE),
    ('costamdiria@gmail.com', 'ward2024', 'Iria Cassia Abreu da Costa', 'mentor_iria', TRUE),
    ('guilhermelavor@yahoo.com.br', 'ward2024', 'Guilherme De Lavor Araujo', 'mentor_guilherme', TRUE),
    ('fernandovasconcellos@ward.com.br', 'ward2024', 'Fernando Vasconcellos', 'mentor_fernando', TRUE)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- USUARIO DE TESTE (ALUNO)
-- =============================================

-- Inserir um aluno de teste para validacao
INSERT INTO users (email, password_hash, full_name, role, first_login_completed, questionnaire_step) VALUES
    ('aluno.teste@wardacademy.com', 'teste123', 'Aluno Teste', 'aluno', FALSE, 0)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- MENSAGEM DE BOAS VINDAS
-- =============================================

-- Mensagem automatica para novos alunos
INSERT INTO messages (user_id, created_by, message, message_type)
SELECT
    u.id,
    (SELECT id FROM users WHERE role = 'mentor_iria' LIMIT 1),
    'Bem-vindo(a) a Ward Academy! Complete seu questionario inicial para comecarmos sua jornada rumo ao USMLE.',
    'info'
FROM users u
WHERE u.role = 'aluno' AND u.email = 'aluno.teste@wardacademy.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- LINKS ADICIONAIS UTEIS
-- =============================================

-- Mais links uteis para a biblioteca
INSERT INTO links_repository (title, url, description, category, tags, is_featured, added_by) VALUES
    ('Amboss', 'https://www.amboss.com/', 'Plataforma de estudo integrada', 'Tools', ARRAY['qbank', 'biblioteca', 'videos'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('UpToDate', 'https://www.uptodate.com/', 'Base de evidencias clinicas', 'Research', ARRAY['evidencia', 'clinica', 'referencia'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('Divine Intervention', 'https://divineinterventionpodcasts.com/', 'Podcasts de revisao', 'Videos', ARRAY['podcast', 'audio', 'revisao'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('Dirty Medicine', 'https://www.youtube.com/@DirtyMedicine', 'Canal YouTube de farmacologia', 'Videos', ARRAY['youtube', 'farmaco', 'visual'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('Osmosis', 'https://www.osmosis.org/', 'Videos educativos de medicina', 'Videos', ARRAY['videos', 'animacao', 'conceitos'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('Lecturio', 'https://www.lecturio.com/', 'Videos e qbank', 'Videos', ARRAY['videos', 'qbank', 'alternativa'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('ERAS', 'https://students-residents.aamc.org/applying-residencies-eras', 'Electronic Residency Application', 'Residency', ARRAY['eras', 'aplicacao', 'residencia'], TRUE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('NRMP Match', 'https://www.nrmp.org/', 'National Resident Matching Program', 'Residency', ARRAY['match', 'nrmp', 'residencia'], TRUE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('FREIDA', 'https://freida.ama-assn.org/', 'Base de dados de programas de residencia', 'Residency', ARRAY['programas', 'busca', 'residencia'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1)),
    ('Doximity', 'https://www.doximity.com/', 'Ranking de programas e networking', 'Residency', ARRAY['ranking', 'network', 'residencia'], FALSE, (SELECT id FROM users WHERE role = 'mentor_marcos' LIMIT 1))
ON CONFLICT DO NOTHING;

-- =============================================
-- POST INICIAL NO BLOG
-- =============================================

-- Post de boas vindas no blog
INSERT INTO blog_posts (user_id, content, is_pinned, pinned_by)
SELECT
    (SELECT id FROM users WHERE role = 'mentor_iria' LIMIT 1),
    'Bem-vindos ao Blog da Ward Academy! Este e o espaco para compartilhar experiencias, duvidas e conquistas na nossa jornada rumo ao USMLE. Sintam-se a vontade para postar e interagir!',
    TRUE,
    (SELECT id FROM users WHERE role = 'mentor_iria' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE is_pinned = TRUE);

-- =============================================
-- LANDMARKS EXEMPLO (para aluno teste)
-- =============================================

-- Criar alguns landmarks de exemplo para o aluno teste
INSERT INTO landmarks (user_id, title, description, landmark_type, order_position, created_by)
SELECT
    u.id,
    'Primeira Chamada com Dra. Iria',
    'Chamada inicial de boas-vindas e planejamento',
    'call_iria',
    1,
    (SELECT id FROM users WHERE role = 'mentor_iria' LIMIT 1)
FROM users u
WHERE u.email = 'aluno.teste@wardacademy.com'
ON CONFLICT DO NOTHING;

INSERT INTO landmarks (user_id, title, description, landmark_type, order_position, created_by)
SELECT
    u.id,
    'Configurar Anki',
    'Chamada para configurar e tirar duvidas sobre Anki',
    'call_guilherme',
    2,
    (SELECT id FROM users WHERE role = 'mentor_guilherme' LIMIT 1)
FROM users u
WHERE u.email = 'aluno.teste@wardacademy.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFICACAO FINAL
-- =============================================

-- Query para verificar os dados inseridos
DO $$
DECLARE
    v_users_count INTEGER;
    v_mentors_count INTEGER;
    v_links_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_users_count FROM users;
    SELECT COUNT(*) INTO v_mentors_count FROM users WHERE role LIKE 'mentor_%';
    SELECT COUNT(*) INTO v_links_count FROM links_repository;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'WARD ACADEMY - SEED DATA COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de usuarios: %', v_users_count;
    RAISE NOTICE 'Total de mentores: %', v_mentors_count;
    RAISE NOTICE 'Total de links: %', v_links_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Credenciais dos mentores:';
    RAISE NOTICE 'marcosantoniodv@gmail.com / ward2024';
    RAISE NOTICE 'costamdiria@gmail.com / ward2024';
    RAISE NOTICE 'guilhermelavor@yahoo.com.br / ward2024';
    RAISE NOTICE 'fernandovasconcellos@ward.com.br / ward2024';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Aluno de teste:';
    RAISE NOTICE 'aluno.teste@wardacademy.com / teste123';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANTE: Troque as senhas apos o primeiro login!';
END $$;
