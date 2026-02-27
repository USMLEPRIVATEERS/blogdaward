-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    section VARCHAR(100) NOT NULL CHECK (section IN ('Avaliação Inicial', 'Síntese de Conhecimento', 'WASA')),
    num_questions INTEGER NOT NULL,
    recommended_time_minutes INTEGER NOT NULL,
    registration_form_url TEXT,
    assessment_url TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create assessment enrollments table
CREATE TABLE IF NOT EXISTS assessment_enrollments (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    authorized_start_date DATE NOT NULL,
    authorized_end_date DATE NOT NULL,
    has_registered BOOLEAN DEFAULT false,
    registration_confirmed_by_mentor BOOLEAN DEFAULT false,
    is_unlocked BOOLEAN DEFAULT false,
    student_marked_registered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlocked_at TIMESTAMP,
    UNIQUE(assessment_id, student_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessments_section ON assessments(section);
CREATE INDEX IF NOT EXISTS idx_assessment_enrollments_student ON assessment_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_enrollments_assessment ON assessment_enrollments(assessment_id);
