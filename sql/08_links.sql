-- =============================================
-- WARD ACADEMY - REPOSITORIO DE LINKS
-- Links uteis organizados por categoria
-- =============================================

-- Categorias de links
CREATE TABLE IF NOT EXISTS link_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(10),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrao
INSERT INTO link_categories (name, description, icon, display_order) VALUES
    ('UWorld', 'Links relacionados ao UWorld e questoes', '📝', 1),
    ('Anki', 'Decks e recursos de Anki', '📚', 2),
    ('First Aid', 'Recursos do First Aid', '📖', 3),
    ('Pathoma', 'Videos e recursos Pathoma', '🔬', 4),
    ('Sketchy', 'Sketchy Medical, Micro, Pharm', '🎨', 5),
    ('Videos', 'Canais do YouTube e videos educativos', '🎬', 6),
    ('Boards and Beyond', 'B&B recursos', '📺', 7),
    ('NBME', 'NBMEs e self-assessments', '📋', 8),
    ('Research', 'Ferramentas e recursos de pesquisa', '🔍', 9),
    ('Residency', 'Informacoes sobre residencia nos EUA', '🏥', 10),
    ('ECFMG', 'Processos e documentos ECFMG', '📄', 11),
    ('OET', 'Recursos para OET', '🗣️', 12),
    ('Scheduling', 'Agendamento de provas', '📅', 13),
    ('Tools', 'Ferramentas uteis de estudo', '🛠️', 14),
    ('Communities', 'Comunidades e foruns', '👥', 15),
    ('Other', 'Outros recursos', '📌', 16)
ON CONFLICT (name) DO NOTHING;

-- Repositorio de links
CREATE TABLE IF NOT EXISTS links_repository (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) REFERENCES link_categories(name),
    tags TEXT[], -- Array de tags para busca
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    added_by BIGINT REFERENCES users(id),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de favoritos do usuario
CREATE TABLE IF NOT EXISTS user_favorite_links (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    link_id BIGINT REFERENCES links_repository(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, link_id)
);

-- Inserir alguns links padrao uteis
INSERT INTO links_repository (title, url, description, category, tags, is_featured, added_by) VALUES
    ('UWorld USMLE', 'https://www.uworld.com/usmle/', 'Plataforma oficial do UWorld', 'UWorld', ARRAY['qbank', 'questoes', 'oficial'], TRUE, NULL),
    ('NBME Self-Assessments', 'https://www.nbme.org/examinees/self-assessments', 'Self-assessments oficiais do NBME', 'NBME', ARRAY['nbme', 'simulado', 'oficial'], TRUE, NULL),
    ('Anki Web', 'https://ankiweb.net/', 'Plataforma oficial do Anki', 'Anki', ARRAY['flashcards', 'srs', 'oficial'], TRUE, NULL),
    ('AnKing Deck', 'https://www.ankingmed.com/', 'Deck AnKing para USMLE', 'Anki', ARRAY['deck', 'anking', 'step1', 'step2'], TRUE, NULL),
    ('First Aid for USMLE Step 1', 'https://www.firstaidteam.com/', 'Site oficial do First Aid', 'First Aid', ARRAY['first aid', 'livro', 'step1'], TRUE, NULL),
    ('Pathoma', 'https://www.pathoma.com/', 'Videos de patologia Dr. Sattar', 'Pathoma', ARRAY['patologia', 'videos', 'sattar'], TRUE, NULL),
    ('Sketchy Medical', 'https://www.sketchy.com/', 'Sketchy Micro, Pharm e Path', 'Sketchy', ARRAY['micro', 'farmaco', 'visual'], TRUE, NULL),
    ('Boards and Beyond', 'https://www.boardsbeyond.com/', 'Videos Dr. Jason Ryan', 'Boards and Beyond', ARRAY['videos', 'step1', 'step2'], TRUE, NULL),
    ('ECFMG', 'https://www.ecfmg.org/', 'Site oficial do ECFMG', 'ECFMG', ARRAY['certificacao', 'img', 'oficial'], TRUE, NULL),
    ('Prometric', 'https://www.prometric.com/', 'Agendamento de provas', 'Scheduling', ARRAY['prova', 'agendamento', 'centro'], TRUE, NULL),
    ('Reddit USMLE', 'https://www.reddit.com/r/step1/', 'Comunidade Reddit Step 1', 'Communities', ARRAY['reddit', 'comunidade', 'discussao'], FALSE, NULL),
    ('PubMed', 'https://pubmed.ncbi.nlm.nih.gov/', 'Base de dados de artigos', 'Research', ARRAY['artigos', 'pesquisa', 'pubmed'], TRUE, NULL),
    ('Cochrane Library', 'https://www.cochranelibrary.com/', 'Revisoes sistematicas', 'Research', ARRAY['cochrane', 'revisao', 'evidencia'], TRUE, NULL),
    ('OET Official', 'https://www.occupationalenglishtest.org/', 'Site oficial do OET', 'OET', ARRAY['oet', 'ingles', 'oficial'], TRUE, NULL)
ON CONFLICT DO NOTHING;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_links_repository_category ON links_repository(category);
CREATE INDEX IF NOT EXISTS idx_links_repository_featured ON links_repository(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_links_repository_tags ON links_repository USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_links_repository_created ON links_repository(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorite_links_user ON user_favorite_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_links_link ON user_favorite_links(link_id);

-- Trigger para updated_at
CREATE TRIGGER update_links_repository_updated_at
    BEFORE UPDATE ON links_repository
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
