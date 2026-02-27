-- =============================================
-- WARD ACADEMY - SISTEMA DE MENSAGENS
-- Mensagens dos mentores para alunos
-- =============================================

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE, -- Destinatario
    created_by BIGINT REFERENCES users(id), -- Remetente (mentor)
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'info' CHECK (message_type IN ('info', 'warning', 'urgent', 'success', 'task')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_broadcast BOOLEAN DEFAULT FALSE, -- Se foi enviada para todos
    related_landmark_id BIGINT REFERENCES landmarks(id) ON DELETE SET NULL,
    related_schedule_id BIGINT REFERENCES schedules(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens em broadcast (para historico)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id BIGSERIAL PRIMARY KEY,
    created_by BIGINT REFERENCES users(id),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'info',
    recipients_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificacoes push (para futuro uso)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    notification_type VARCHAR(50),
    data JSONB, -- Dados extras como link, action, etc.
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funcao para enviar broadcast para todos os alunos
CREATE OR REPLACE FUNCTION send_broadcast_message(
    p_sender_id BIGINT,
    p_message TEXT,
    p_message_type VARCHAR DEFAULT 'info'
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Inserir mensagem para todos os alunos
    INSERT INTO messages (user_id, created_by, message, message_type, is_broadcast)
    SELECT id, p_sender_id, p_message, p_message_type, TRUE
    FROM users
    WHERE role = 'aluno';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Registrar no historico de broadcasts
    INSERT INTO broadcast_messages (created_by, message, message_type, recipients_count)
    VALUES (p_sender_id, p_message, p_message_type, v_count);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_created ON broadcast_messages(created_at DESC);
