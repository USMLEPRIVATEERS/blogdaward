# Guia de Migração de Segurança - Ward Academy

## O Problema Atual

1. **RLS está DESABILITADO** em todas as tabelas
2. Qualquer pessoa com a chave `anon` pode ler TODOS os dados
3. A autenticação é feita manualmente (insegura)

## Solução em 3 Passos

### Passo 1: Executar o SQL de Segurança (URGENTE)

Execute o arquivo `sql/70_auth_migration.sql` no Supabase SQL Editor.

Este script:
- Adiciona coluna `auth_id` para vincular com Supabase Auth
- Habilita RLS na tabela `users`
- Cria policies que permitem:
  - Usuários verem apenas seus próprios dados
  - Mentores verem todos os dados

### Passo 2: Deploy da Edge Function

```bash
# Instalar Supabase CLI se não tiver
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref yxtdesthusclivjdewfl

# Deploy da função
supabase functions deploy manage-users
```

### Passo 3: Migrar Usuários Existentes

Os mentores precisam migrar cada usuário para o Supabase Auth.
Use a função `migrateUser()` do `secure-auth.js`:

```javascript
// No console do browser (logado como mentor)
await SecureAuth.migrateUser(userId, 'senha_do_usuario');
```

---

## Como Funciona Depois da Migração

### Criar Novo Usuário (Mentor)

```javascript
const result = await SecureAuth.createUser({
    email: 'aluno@email.com',
    password: 'senha123',
    full_name: 'Nome do Aluno',
    role: 'aluno',
    cpf: '12345678900'
});

if (result.success) {
    console.log('Usuário criado:', result.user);
}
```

### Login (Usuário)

```javascript
// Por email
const result = await SecureAuth.login('aluno@email.com', 'senha123');

// Ou por CPF (se migrado)
const result = await SecureAuth.loginByCPF('12345678900', 'senha123');
```

### Verificar Autenticação

```javascript
const user = await SecureAuth.checkAuth();
if (!user) {
    // Não autenticado - redirecionar para login
}
```

---

## Segurança das Chaves

| Chave | Onde Usar | Segurança |
|-------|-----------|-----------|
| `anon` | Browser (público) | ✅ OK - RLS protege |
| `service_role` | Edge Functions apenas | ⚠️ NUNCA no browser |

A chave `anon` pode ser pública porque o RLS limita o acesso.
A chave `service_role` só existe nas Edge Functions (servidor).

---

## Checklist de Segurança

- [ ] Executar `sql/70_auth_migration.sql`
- [ ] Deploy da Edge Function `manage-users`
- [ ] Migrar usuários existentes para Supabase Auth
- [ ] Testar login com novo sistema
- [ ] Habilitar RLS nas outras tabelas importantes

---

## Emergência: Se Algo Der Errado

Se o sistema parar de funcionar após habilitar RLS:

```sql
-- Desabilitar RLS temporariamente (NÃO deixar assim em produção!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Mas lembre-se: isso deixa os dados expostos novamente.
