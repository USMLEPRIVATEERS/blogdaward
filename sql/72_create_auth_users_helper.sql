-- =============================================
-- HELPER: LISTAR USUÁRIOS PARA CRIAR NO AUTH
-- =============================================
-- Execute este script para ver quais usuários precisam ser criados
-- no Supabase Auth Dashboard

-- Lista todos os usuários que NÃO têm auth_id ainda
SELECT
    id,
    email,
    full_name,
    role,
    cpf,
    created_at
FROM users
WHERE auth_id IS NULL
ORDER BY
    CASE
        WHEN role LIKE 'mentor%' THEN 1
        ELSE 2
    END,
    id;

-- =============================================
-- COMO CRIAR USUÁRIOS NO SUPABASE AUTH:
-- =============================================
--
-- OPÇÃO 1: Via Dashboard (recomendado para poucos usuários)
--   1. Vá em: Authentication → Users → Add user
--   2. Preencha Email e Password
--   3. Marque "Auto Confirm User"
--   4. Clique Create
--
-- OPÇÃO 2: Via API (para muitos usuários)
--   Use o script Node.js abaixo com a chave service_role:
--
-- ```javascript
-- const { createClient } = require('@supabase/supabase-js');
--
-- const supabase = createClient(
--   'https://yxtdesthusclivjdewfl.supabase.co',
--   'SUA_SERVICE_ROLE_KEY' // NÃO a anon key!
-- );
--
-- async function createAuthUser(email, password, fullName) {
--   const { data, error } = await supabase.auth.admin.createUser({
--     email,
--     password,
--     email_confirm: true,
--     user_metadata: { full_name: fullName }
--   });
--   if (error) console.error('Erro:', email, error.message);
--   else console.log('Criado:', email, data.user.id);
--   return data?.user?.id;
-- }
--
-- // Criar usuários
-- await createAuthUser('marcos@email.com', 'senha123', 'Marcos');
-- await createAuthUser('iria@email.com', 'senha123', 'Iria');
-- // ... etc
-- ```
--
-- OPÇÃO 3: Usar a Edge Function manage-users (após deploy)
--   A Edge Function pode criar usuários de forma segura
--
-- =============================================
