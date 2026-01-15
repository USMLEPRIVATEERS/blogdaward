-- Create table for UWorld autocomplete options (subject, system, category)
CREATE TABLE IF NOT EXISTS uworld_options (
    id SERIAL PRIMARY KEY,
    option_type VARCHAR(50) NOT NULL, -- 'subject', 'system', 'category'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(option_type, name)
);

-- Insert default systems
INSERT INTO uworld_options (option_type, name) VALUES
    ('system', 'General Principles'),
    ('system', 'Behavioral Sciences'),
    ('system', 'Biochemistry'),
    ('system', 'Microbiology'),
    ('system', 'Immunology'),
    ('system', 'Pathology'),
    ('system', 'Pharmacology'),
    ('system', 'Cardiovascular'),
    ('system', 'Respiratory'),
    ('system', 'Renal'),
    ('system', 'Gastrointestinal'),
    ('system', 'Reproductive'),
    ('system', 'Endocrine'),
    ('system', 'Hematology & Oncology'),
    ('system', 'Musculoskeletal'),
    ('system', 'Neurology'),
    ('system', 'Psychiatry'),
    ('system', 'Dermatology'),
    ('system', 'Mixed/Random')
ON CONFLICT (option_type, name) DO NOTHING;

-- Insert default subjects
INSERT INTO uworld_options (option_type, name) VALUES
    ('subject', 'All'),
    ('subject', 'Anatomy'),
    ('subject', 'Biochemistry'),
    ('subject', 'Physiology'),
    ('subject', 'Pathology'),
    ('subject', 'Pharmacology'),
    ('subject', 'Microbiology'),
    ('subject', 'Immunology'),
    ('subject', 'Behavioral Science'),
    ('subject', 'Biostatistics'),
    ('subject', 'Genetics')
ON CONFLICT (option_type, name) DO NOTHING;

-- Insert default categories
INSERT INTO uworld_options (option_type, name) VALUES
    ('category', 'All'),
    ('category', 'New Questions'),
    ('category', 'Incorrect'),
    ('category', 'Marked'),
    ('category', 'Previously Used')
ON CONFLICT (option_type, name) DO NOTHING;

-- Add new columns to uworld_diary table if not exist
ALTER TABLE uworld_diary ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE uworld_diary ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE uworld_diary ADD COLUMN IF NOT EXISTS exam_type VARCHAR(50);

-- Enable RLS
ALTER TABLE uworld_options ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read options
CREATE POLICY "Anyone can read uworld options" ON uworld_options
    FOR SELECT USING (true);

-- Allow all authenticated users to insert options
CREATE POLICY "Anyone can insert uworld options" ON uworld_options
    FOR INSERT WITH CHECK (true);
