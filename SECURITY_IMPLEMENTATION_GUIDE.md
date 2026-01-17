# Guia de Implementação de Segurança - Ward Academy

## Resumo das Melhorias

Este guia descreve como implementar as melhorias de segurança na plataforma Ward Academy.

### O que foi criado:

1. **`sql/50_security_functions.sql`** - Funções RPC seguras para:
   - Login com hash bcrypt (não mais base64)
   - Registro com hash bcrypt
   - Alteração de senha
   - Verificação de permissões

2. **`sql/51_rls_simplified.sql`** - Políticas RLS que:
   - Habilitam RLS em todas as tabelas
   - Protegem dados sensíveis
   - Permitem acesso de mentores aos dados de alunos

3. **`js/security.js`** - Utilitários de segurança:
   - Sanitização XSS (previne injeção de scripts)
   - Validação de CPF com algoritmo
   - Rate limiting para login
   - Armazenamento seguro de dados

4. **`js/secure-auth.js`** - Autenticação segura:
   - Login usando RPC (hash no servidor)
   - Registro usando RPC
   - Não armazena password_hash no localStorage

---

## Passo 1: Executar os Scripts SQL no Supabase

### 1.1 Acesse o SQL Editor do Supabase

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `yxtdesthusclivjdewfl`
3. Clique em "SQL Editor" no menu lateral

### 1.2 Execute o script de funções de segurança

1. Clique em "New Query"
2. Cole o conteúdo de `sql/50_security_functions.sql`
3. Clique em "Run"
4. Verifique se não há erros

### 1.3 Execute o script de RLS

1. Clique em "New Query"
2. Cole o conteúdo de `sql/51_rls_simplified.sql`
3. Clique em "Run"
4. Verifique se não há erros

---

## Passo 2: Migrar Senhas Existentes

As senhas antigas estão em base64 (inseguro). A função `verify_password` suporta ambos os formatos durante a transição.

### Opção A: Migração Gradual (Recomendado)
- Usuários continuam usando senhas atuais
- Quando fizerem login com sucesso, a senha é automaticamente "válida"
- Novos registros usam bcrypt
- Com o tempo, pode-se forçar reset de senha

### Opção B: Reset de Senhas
Execute no SQL Editor para listar usuários com senha legada:
```sql
SELECT id, email, full_name
FROM users
WHERE password_hash NOT LIKE '$2%';
```

Para forçar reset, você pode criar uma senha temporária:
```sql
UPDATE users
SET password_hash = crypt('senha_temporaria_2024', gen_salt('bf', 10))
WHERE password_hash NOT LIKE '$2%';
```
E depois notificar os usuários para alterarem.

---

## Passo 3: Testar a Implementação

### 3.1 Testar Login Seguro
1. Acesse a página de login
2. Abra o DevTools (F12) → Console
3. Tente fazer login
4. Deve aparecer: `WardSecureAuth: Funcoes de seguranca ativadas`

### 3.2 Testar Registro Seguro
1. Acesse a página de registro
2. Crie uma conta de teste
3. Verifique no Supabase se a senha começa com `$2` (bcrypt)

### 3.3 Verificar RLS
No SQL Editor do Supabase:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```
Todas devem mostrar `rowsecurity = true`

---

## Passo 4: Proteções Adicionais no Supabase

### 4.1 Configurar CORS (opcional mas recomendado)
Em Settings → API → CORS:
- Adicione apenas seu domínio: `https://wardacademy.org`

### 4.2 Rotacionar a Chave Anon (CRÍTICO)
**A chave atual está exposta no código!**

1. Vá para Settings → API
2. Clique em "Generate new key" para a chave anon
3. Atualize todos os arquivos JS com a nova chave
4. A chave antiga será invalidada

**Arquivos para atualizar:**
- `js/app.js` (linha 5)
- `js/register.js` (linha 24)
- Outros arquivos listados no relatório

### 4.3 Habilitar Rate Limiting (opcional)
No Supabase Dashboard → Settings → Auth:
- Configure limite de requisições por IP

---

## Resumo de Segurança Implementada

| Vulnerabilidade | Antes | Depois |
|-----------------|-------|--------|
| Hash de senha | Base64 (reversível) | bcrypt (irreversível) |
| RLS | Desabilitado | Habilitado com políticas |
| XSS | Sem proteção | Sanitização automática |
| Rate limiting login | Nenhum | 5 tentativas / 5 min |
| Dados no localStorage | password_hash exposto | Apenas dados não sensíveis |
| Validação CPF | Apenas formato | Algoritmo completo |
| view_as | Client-side | Validado no servidor |

---

## Próximos Passos Recomendados

1. **URGENTE**: Rotacionar a chave Supabase
2. **IMPORTANTE**: Executar os scripts SQL
3. **RECOMENDADO**: Migrar senhas legadas
4. **OPCIONAL**: Adicionar HTTPS-only cookies
5. **FUTURO**: Migrar para Supabase Auth nativo

---

## Compatibilidade

O sistema foi feito para ser **retrocompatível**:
- Se as funções RPC não existirem, usa o método antigo
- Senhas antigas continuam funcionando
- Nenhuma funcionalidade quebra imediatamente

Isso permite uma migração gradual sem downtime.

---

## Arquivos Modificados

- `index.html` - Adicionados scripts de segurança
- `register.html` - Adicionados scripts de segurança
- `js/register.js` - Usa registro seguro via RPC

## Arquivos Criados

- `sql/50_security_functions.sql` - Funções RPC seguras
- `sql/51_rls_simplified.sql` - Políticas RLS
- `js/security.js` - Utilitários de segurança
- `js/secure-auth.js` - Autenticação segura
- `SECURITY_IMPLEMENTATION_GUIDE.md` - Este guia
