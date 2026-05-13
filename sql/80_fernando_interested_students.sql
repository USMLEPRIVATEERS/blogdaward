-- =============================================
-- TABELA: fernando_interested_students
-- Marcos marca quais alunos estao interessados na mentoria do Fernando
-- =============================================

CREATE TABLE IF NOT EXISTS fernando_interested_students (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marked_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_fernando_interested_student ON fernando_interested_students(student_id);
CREATE INDEX IF NOT EXISTS idx_fernando_interested_marked_by ON fernando_interested_students(marked_by);

-- RLS
ALTER TABLE fernando_interested_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY fernando_interested_all ON fernando_interested_students
    FOR ALL USING (true) WITH CHECK (true);
