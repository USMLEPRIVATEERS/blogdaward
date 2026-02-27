-- =============================================
-- WARD ACADEMY - PROJETOS DE PESQUISA
-- Sistema de gerenciamento de revisoes sistematicas
-- =============================================

-- Tabela de projetos de pesquisa
CREATE TABLE IF NOT EXISTS research_projects (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    participants BIGINT[] DEFAULT '{}', -- Array de user_ids
    deadline DATE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas de pesquisa
CREATE TABLE IF NOT EXISTS research_tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES research_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    stage VARCHAR(100) NOT NULL DEFAULT 'nova_tarefa',
    assigned_to BIGINT REFERENCES users(id),
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de estagios de pesquisa (referencia com todas as 39 etapas)
CREATE TABLE IF NOT EXISTS research_stages (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    phase VARCHAR(100), -- Fase geral (Ideacao, Protocolo, Busca, etc.)
    is_active BOOLEAN DEFAULT TRUE
);

-- Inserir os 39 estagios da revisao sistematica
INSERT INTO research_stages (code, name, display_order, phase) VALUES
    ('nova_tarefa', 'Nova tarefa', 1, 'Inicio'),
    ('testando_ideia', 'Testando ideia', 2, 'Ideacao'),
    ('encontrando_estudos', 'Encontrando estudos', 3, 'Ideacao'),
    ('estrategia_busca', 'Estrategia de busca', 4, 'Ideacao'),
    ('validando_ideia', 'Validando ideia', 5, 'Ideacao'),
    ('escrever_protocolo', 'Escrever protocolo', 6, 'Protocolo'),
    ('exportar_databases', 'Exportar de databases', 7, 'Busca'),
    ('desduplicar', 'Desduplicar', 8, 'Busca'),
    ('revisores_1_2', 'Revisores 1 e 2', 9, 'Screening'),
    ('revisor_3', 'Revisor 3', 10, 'Screening'),
    ('baixando_pdfs', 'Baixando PDFs', 11, 'Screening'),
    ('leitura_completa', 'Leitura completa', 12, 'Screening'),
    ('prisma_flow', 'PRISMA Flow Diagram', 13, 'Documentacao'),
    ('tabela_pico', 'Tabela PICO', 14, 'Documentacao'),
    ('extracao_dados', 'Extracao de dados', 15, 'Analise'),
    ('analise_estatistica', 'Analise estatistica padrao', 16, 'Analise'),
    ('analises_adicionais', 'Analises estatisticas adicionais', 17, 'Analise'),
    ('risco_vies_1_2', 'Risco de vies revisores 1 e 2', 18, 'Qualidade'),
    ('risco_vies_3', 'Risco de vies revisor 3', 19, 'Qualidade'),
    ('graficos_desfechos', 'Graficos de desfechos', 20, 'Visualizacao'),
    ('graficos_vieses', 'Graficos de vieses', 21, 'Visualizacao'),
    ('grade', 'GRADE', 22, 'Qualidade'),
    ('submeter_prospero', 'Submeter ao PROSPERO', 23, 'Registro'),
    ('escrever_abstract', 'Escrever Abstract', 24, 'Redacao'),
    ('submeter_congresso', 'Submeter para congresso', 25, 'Submissao'),
    ('escrever_introduction', 'Escrever Introduction', 26, 'Redacao'),
    ('escrever_methods', 'Escrever Methods', 27, 'Redacao'),
    ('escrever_results', 'Escrever Results', 28, 'Redacao'),
    ('escrever_discussion', 'Escrever Discussion', 29, 'Redacao'),
    ('escrever_conclusion', 'Escrever Conclusion', 30, 'Redacao'),
    ('escrever_limitations', 'Escrever Limitations', 31, 'Redacao'),
    ('escrever_references', 'Escrever References', 32, 'Redacao'),
    ('encontrar_revistas', 'Encontrar revistas', 33, 'Submissao'),
    ('escrever_cover_letter', 'Escrever Cover Letter', 34, 'Submissao'),
    ('submeter_revista', 'Submeter para revista', 35, 'Submissao'),
    ('responder_revisores', 'Responder revisores', 36, 'Revisao'),
    ('escrever_rebuttal', 'Escrever Rebuttal Letter', 37, 'Revisao'),
    ('ultimos_ajustes', 'Ultimos ajustes', 38, 'Finalizacao'),
    ('tarefa_concluida', 'Tarefa concluida', 39, 'Concluido')
ON CONFLICT (code) DO NOTHING;

-- Tabela de coautores (para relacionamento mais flexivel)
CREATE TABLE IF NOT EXISTS research_coauthors (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES research_projects(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'coauthor', -- 'lead', 'coauthor', 'reviewer', etc.
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Tabela de anotacoes/comentarios em projetos
CREATE TABLE IF NOT EXISTS research_notes (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES research_projects(id) ON DELETE CASCADE,
    task_id BIGINT REFERENCES research_tasks(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_research_projects_created_by ON research_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_research_projects_participants ON research_projects USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_research_tasks_project ON research_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_assigned ON research_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_research_tasks_stage ON research_tasks(stage);
CREATE INDEX IF NOT EXISTS idx_research_coauthors_project ON research_coauthors(project_id);
CREATE INDEX IF NOT EXISTS idx_research_coauthors_user ON research_coauthors(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_project ON research_notes(project_id);

-- Triggers para updated_at
CREATE TRIGGER update_research_projects_updated_at
    BEFORE UPDATE ON research_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_tasks_updated_at
    BEFORE UPDATE ON research_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
