-- =============================================
-- Adicionar status de aprovação para projetos de pesquisa
-- Permite que alunos criem projetos que precisam de aprovação de mentor
-- =============================================

-- Atualizar constraint de status para incluir 'pending_approval'
ALTER TABLE research_projects
DROP CONSTRAINT IF EXISTS research_projects_status_check;

ALTER TABLE research_projects
ADD CONSTRAINT research_projects_status_check
CHECK (status IN ('pending_approval', 'active', 'paused', 'completed', 'cancelled'));

-- Adicionar campo para armazenar quem aprovou e quando
ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id);

ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo para motivo de rejeição (se rejeitado)
ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Índice para buscar projetos pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_research_projects_pending
ON research_projects(status) WHERE status = 'pending_approval';
