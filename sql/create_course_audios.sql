-- Tabela para armazenar os audio resumos
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS course_audios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    tags TEXT NOT NULL, -- Hierarquia de pastas separada por :: (ex: USMLE::STEP_1::Cardio)
    audio_url TEXT, -- Link do Google Drive
    description TEXT,
    duration_minutes INTEGER,
    order_position INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE course_audios ENABLE ROW LEVEL SECURITY;

-- Politica para permitir leitura publica de audios publicados
CREATE POLICY "Allow public read access to published audios"
ON course_audios
FOR SELECT
USING (is_published = true);

-- Politica para permitir operacoes completas para usuarios autenticados (mentores)
CREATE POLICY "Allow authenticated users full access"
ON course_audios
FOR ALL
USING (auth.role() = 'authenticated');

-- Indice para melhorar performance de busca por tags
CREATE INDEX IF NOT EXISTS idx_course_audios_tags ON course_audios(tags);

-- Indice para ordenacao
CREATE INDEX IF NOT EXISTS idx_course_audios_order ON course_audios(order_position);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_course_audios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_audios_updated_at
    BEFORE UPDATE ON course_audios
    FOR EACH ROW
    EXECUTE FUNCTION update_course_audios_updated_at();

-- =====================================================
-- Tabela para comentarios dos audios
-- =====================================================

CREATE TABLE IF NOT EXISTS course_audio_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audio_id UUID NOT NULL REFERENCES course_audios(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE course_audio_comments ENABLE ROW LEVEL SECURITY;

-- Politica para permitir leitura publica de comentarios
CREATE POLICY "Anyone can view audio comments"
ON course_audio_comments
FOR SELECT
USING (true);

-- Politica para permitir usuarios autenticados inserir comentarios
CREATE POLICY "Authenticated users can add audio comments"
ON course_audio_comments
FOR INSERT
WITH CHECK (true);

-- Politica para permitir usuarios deletar comentarios (verificado na aplicacao)
CREATE POLICY "Users can delete audio comments"
ON course_audio_comments
FOR DELETE
USING (true);

-- Indice para busca por audio
CREATE INDEX IF NOT EXISTS idx_course_audio_comments_audio ON course_audio_comments(audio_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_course_audio_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_audio_comments_updated_at
    BEFORE UPDATE ON course_audio_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_audio_comments_updated_at();
