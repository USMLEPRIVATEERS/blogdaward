#!/bin/bash
# =====================================================
# Script de Deploy do Sistema de Emails
# =====================================================
# Execute este script na sua máquina local

set -e  # Para execução ao encontrar erro

echo "🚀 Iniciando deploy do sistema de emails..."
echo ""

# Verificar se está na pasta correta
if [ ! -d "supabase/functions/send-call-emails" ]; then
    echo "❌ Erro: Pasta supabase/functions/send-call-emails não encontrada"
    echo "Execute este script na pasta raiz do projeto blogdaward"
    exit 1
fi

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo ""
    echo "Instale com um dos comandos:"
    echo "  macOS:   brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo "  Linux:   brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado"
supabase --version
echo ""

# Login (se necessário)
echo "🔐 Fazendo login no Supabase..."
supabase login || echo "Já está logado ou erro no login"
echo ""

# Link ao projeto
echo "🔗 Linkando ao projeto yxtdesthusclivjdewfl..."
supabase link --project-ref yxtdesthusclivjdewfl || echo "Projeto já linkado"
echo ""

# Configurar secrets
echo "🔐 Configurando secrets..."
supabase secrets set SMTP_USERNAME=marcosantoniodv@gmail.com
echo "✅ SMTP_USERNAME configurado"

supabase secrets set SMTP_PASSWORD="hyci yjkn ebaj xtgg"
echo "✅ SMTP_PASSWORD configurado"

supabase secrets set SMTP_FROM="Ward Academy <marcosantoniodv@gmail.com>"
echo "✅ SMTP_FROM configurado"
echo ""

# Verificar secrets
echo "📋 Verificando secrets configurados:"
supabase secrets list
echo ""

# Deploy da função
echo "🚀 Fazendo deploy da função send-call-emails..."
supabase functions deploy send-call-emails
echo ""

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🔗 URL da função:"
echo "https://yxtdesthusclivjdewfl.supabase.co/functions/v1/send-call-emails"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute o SQL create_email_notifications.sql no Supabase Dashboard"
echo "2. Configure o Cron Job (veja SETUP-EMAIL-NOTIFICATIONS.md)"
echo "3. Teste agendando uma chamada em landmarks.html"
