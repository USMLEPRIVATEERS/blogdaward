-- Add original_stage column to research_tasks table
-- This column stores the original stage of a task before it was marked as completed
-- Allows restoring the task to its previous stage when unchecking completion

ALTER TABLE research_tasks
ADD COLUMN IF NOT EXISTS original_stage VARCHAR(100);

-- For existing tasks that are completed, set a default original_stage
UPDATE research_tasks
SET original_stage = 'nova_tarefa'
WHERE stage = 'tarefa_concluida' AND original_stage IS NULL;

-- For existing tasks that are NOT completed, leave original_stage as NULL
-- (it will be populated when they are marked as complete)

COMMENT ON COLUMN research_tasks.original_stage IS 'Stores the original stage before the task was marked as completed, allowing restoration when unchecked';
