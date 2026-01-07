# 📧 Configuração do Sistema de Notificações por Email

Este guia mostra como configurar o sistema completo de notificações por email para chamadas agendadas.

## 📋 Resumo do Sistema

Quando um aluno agenda uma chamada em `landmarks.html`, o sistema **automaticamente**:

1. ✅ Cria 3 emails para o **MENTOR**:
   - Email imediato com dados completos do aluno
   - Email 24h antes da chamada
   - Email 12h antes da chamada

2. ✅ Cria 3 emails para o **ALUNO**:
   - Email imediato confirmando agendamento
   - Email 24h antes da chamada
   - Email 12h antes da chamada

## 🔧 Passo 1: Configurar Gmail App Password

1. **Acesse:** https://myaccount.google.com/apppasswords
2. **Login:** marcosantoniodv@gmail.com
3. **Criar App Password:**
   - Nome: "Ward Academy Supabase Notifications"
   - Copie a senha de 16 caracteres (algo como: `xxxx xxxx xxxx xxxx`)

## 🗄️ Passo 2: Executar SQL no Supabase

1. **Abra Supabase:** https://supabase.com/dashboard
2. **Vá em:** SQL Editor
3. **Execute o arquivo:** `sql/create_email_notifications.sql`

```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Isso vai criar:
-- - Tabela scheduled_emails
-- - Trigger automático
-- - Funções auxiliares
```

**Confirme que criou:**
- ✅ Tabela `scheduled_emails`
- ✅ Trigger `trigger_schedule_call_emails`
- ✅ Função `schedule_call_email_notifications()`
- ✅ Função `get_pending_emails()`

## 🚀 Passo 3: Deploy da Edge Function

### 3.1 Instalar Supabase CLI (se ainda não tem)

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 3.2 Login no Supabase

```bash
supabase login
```

### 3.3 Link ao seu projeto

```bash
# Na pasta do projeto
cd /caminho/para/blogdaward
supabase link --project-ref SEU_PROJECT_REF
```

### 3.4 Configurar Secrets (IMPORTANTE!)

```bash
# SMTP Username (seu email)
supabase secrets set SMTP_USERNAME=marcosantoniodv@gmail.com

# SMTP Password (App Password do Gmail - 16 caracteres)
supabase secrets set SMTP_PASSWORD="xxxx xxxx xxxx xxxx"

# SMTP From (email que aparece como remetente)
supabase secrets set SMTP_FROM="Ward Academy <marcosantoniodv@gmail.com>"
```

### 3.5 Deploy da função

```bash
supabase functions deploy send-call-emails
```

**Confirme que apareceu:**
```
Deployed Function send-call-emails
URL: https://SEU_PROJECT.supabase.co/functions/v1/send-call-emails
```

## ⏰ Passo 4: Configurar Cron Job

O Cron Job vai executar a função a cada 5 minutos para enviar emails pendentes.

### Opção A: Via Supabase Dashboard (Recomendado)

1. **Acesse:** Dashboard > Database > Extensions
2. **Ative:** `pg_cron`
3. **Vá em:** SQL Editor
4. **Execute:**

```sql
-- Criar cron job para enviar emails a cada 5 minutos
SELECT cron.schedule(
    'send-scheduled-call-emails',
    '*/5 * * * *', -- A cada 5 minutos
    $$
    SELECT
      net.http_post(
          url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/send-call-emails',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
          body := '{}'::jsonb
      ) as request_id;
    $$
);
```

**⚠️ IMPORTANTE:** Substitua `SEU_PROJECT_ID` pelo ID real do seu projeto!

### Opção B: Via Supabase CLI

```bash
# Criar extensão pg_cron
supabase functions deploy send-call-emails --no-verify-jwt

# Agendar cron
psql $DATABASE_URL -c "
SELECT cron.schedule(
    'send-scheduled-call-emails',
    '*/5 * * * *',
    $$ SELECT net.http_post(...) $$
);"
```

## ✅ Passo 5: Testar o Sistema

### 5.1 Teste Manual (sem agendar chamada real)

```sql
-- Inserir email de teste direto na tabela
INSERT INTO scheduled_emails (
    scheduled_call_id,
    recipient_email,
    recipient_type,
    email_type,
    send_at,
    status
) VALUES (
    1, -- ID de uma chamada existente
    'seu-email-de-teste@gmail.com',
    'mentor',
    'immediate',
    NOW(), -- Envia agora
    'pending'
);
```

### 5.2 Aguarde 5 minutos

O cron job vai executar e enviar o email.

### 5.3 Verificar Logs

```bash
# Ver logs da Edge Function
supabase functions logs send-call-emails

# Ou via dashboard:
# Dashboard > Edge Functions > send-call-emails > Logs
```

### 5.4 Verificar Tabela

```sql
-- Ver emails enviados
SELECT * FROM scheduled_emails
WHERE status = 'sent'
ORDER BY sent_at DESC;

-- Ver emails com erro
SELECT * FROM scheduled_emails
WHERE status = 'failed';
```

## 📧 Conteúdo dos Emails

### Email para MENTOR (dados completos):

- ✅ Nome completo do aluno
- ✅ Email do aluno
- ✅ WhatsApp do aluno (link wa.me)
- ✅ Tema da chamada
- ✅ Data e horário
- ✅ Observações (notes)

### Email para ALUNO (dados básicos):

- ✅ Nome do mentor
- ✅ WhatsApp do mentor (link wa.me)
- ✅ Data e horário
- ✅ Tema da chamada

## 🔍 Monitoramento

### Ver quantos emails estão pendentes:

```sql
SELECT
    recipient_type,
    email_type,
    COUNT(*) as total
FROM scheduled_emails
WHERE status = 'pending'
GROUP BY recipient_type, email_type;
```

### Ver última execução do cron:

```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'send-scheduled-call-emails'
ORDER BY start_time DESC
LIMIT 10;
```

### Ver emails programados para hoje:

```sql
SELECT
    se.*,
    sc.scheduled_date,
    sc.scheduled_time
FROM scheduled_emails se
JOIN scheduled_calls sc ON se.scheduled_call_id = sc.id
WHERE DATE(sc.scheduled_date) = CURRENT_DATE
ORDER BY se.send_at;
```

## 🚨 Solução de Problemas

### Emails não estão sendo enviados

1. **Verificar App Password do Gmail:**
   ```bash
   supabase secrets list
   # Deve mostrar SMTP_USERNAME e SMTP_PASSWORD
   ```

2. **Verificar se função está deployada:**
   ```bash
   supabase functions list
   # Deve mostrar send-call-emails
   ```

3. **Verificar logs de erro:**
   ```bash
   supabase functions logs send-call-emails --tail
   ```

4. **Testar função manualmente:**
   ```bash
   curl -X POST 'https://SEU_PROJECT.supabase.co/functions/v1/send-call-emails' \
     -H "Authorization: Bearer SEU_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

### Emails indo para Spam

1. **Configure SPF do domínio** (se usar domínio customizado)
2. **Configure DKIM** (Gmail faz isso automaticamente com App Password)
3. **Peça aos usuários** para adicionarem `marcosantoniodv@gmail.com` aos contatos

### Limite de envios do Gmail

- Gmail permite ~500 emails/dia com App Password
- Se precisar mais, considere:
  - SendGrid (100 emails/dia grátis)
  - Resend (3,000 emails/mês grátis)
  - AWS SES

## 📊 Estatísticas

Para ver estatísticas de emails:

```sql
-- Total de emails por status
SELECT status, COUNT(*) as total
FROM scheduled_emails
GROUP BY status;

-- Taxa de sucesso nos últimos 7 dias
SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE status = 'sent') as sent,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / COUNT(*), 2) as success_rate
FROM scheduled_emails
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🎯 Checklist Final

- [ ] Gmail App Password criado
- [ ] SQL `create_email_notifications.sql` executado
- [ ] Edge Function deployada
- [ ] Secrets configurados (SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM)
- [ ] Cron job configurado
- [ ] Teste manual funcionou
- [ ] Emails chegando corretamente

## 📞 Suporte

Se tiver problemas:

1. **Verifique logs:** `supabase functions logs send-call-emails`
2. **Verifique tabela:** `SELECT * FROM scheduled_emails WHERE status = 'failed'`
3. **Teste função manual:** Use o curl acima

---

**Sistema criado por:** Claude AI
**Data:** 2025-01-07
**Versão:** 1.0
