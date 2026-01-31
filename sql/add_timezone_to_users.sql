-- =============================================
-- WARD ACADEMY - ADD TIMEZONE SUPPORT
-- Execute: add_timezone_to_users.sql
-- =============================================

-- Add timezone column to users table (default: America/Sao_Paulo = Brasilia UTC-3)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';

-- Add timezone to scheduled_calls so we know what timezone the student was in when scheduling
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS student_timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';
