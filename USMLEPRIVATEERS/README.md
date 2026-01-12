# 🏴‍☠️ USMLE Privateers - Plataforma Social

**We're all in the same boat!**

Uma rede social completa para a comunidade USMLE Privateers, construída com HTML5 + Vanilla JavaScript + Supabase.

## 📁 Estrutura do Projeto

```
USMLEPRIVATEERS/
├── css/
│   └── style.css          # Estilos globais com tema Privateers
├── js/
│   └── app.js             # Lógica principal da aplicação
├── sql/
│   ├── 01_users.sql       # Schema de usuários e questionário
│   ├── 02_blog.sql        # Schema do blog (posts, tags, reactions)
│   ├── 03_wiki.sql        # Schema da wiki (folders, articles)
│   ├── 04_rls_policies.sql # Políticas de segurança RLS
│   └── 05_landing_stats.sql # Stats da landing page e posts em destaque
├── index.html             # Landing page pública
├── login.html             # Login e registro
├── onboarding.html        # Onboarding (estudante/formado)
├── dashboard.html         # Dashboard do membro
├── blog.html              # Blog com posts temporários
├── wiki.html              # Wiki em formato de pastas
├── whatsapp.html          # Acesso ao WhatsApp (após questionário)
├── profile.html           # Perfil do usuário
├── founder-dashboard.html # Dashboard dos fundadores (Marcos e Iria)
├── adm-dashboard.html     # Dashboard dos ADMs
└── README.md              # Este arquivo
```

## 🎨 Cores da Marca

```css
--primary-red: #b8565c      /* Cor principal */
--primary-white: #fefefe    /* Branco */
--primary-light-pink: #d7aeb0  /* Rosa claro */
--primary-medium-pink: #bf8088 /* Rosa médio */
--primary-cream: #fff9f8    /* Creme de fundo */
```

## 🔐 Roles de Usuário

1. **Fundador** (`fundador`) - Marcos e Iria
   - Acesso total a todos os dados dos membros
   - Gerenciar estatísticas da landing page
   - Selecionar posts para destaque
   - Gerenciar questionário
   - Adicionar/editar/excluir conteúdo da Wiki

2. **ADM** (`adm`)
   - Adicionar/editar conteúdo da Wiki
   - Criar posts no blog
   - NÃO pode ver dados de membros
   - NÃO pode gerenciar stats ou posts em destaque

3. **Membro** (`membro`)
   - Visualizar Wiki
   - Criar posts no blog
   - Responder questionário
   - Acesso ao WhatsApp após completar questionário

## 🚀 Configuração do Supabase

### 1. Criar projeto no Supabase

Acesse https://supabase.com e crie um novo projeto.

### 2. Executar os SQLs

Execute os arquivos SQL na ordem:
1. `sql/01_users.sql`
2. `sql/02_blog.sql`
3. `sql/03_wiki.sql`
4. `sql/04_rls_policies.sql`
5. `sql/05_landing_stats.sql`

### 3. Configurar credenciais

Edite `js/app.js` e substitua:

```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
```

### 4. Configurar link do WhatsApp

No arquivo `js/app.js`, atualize:

```javascript
const WHATSAPP_COMMUNITY_LINK = 'SEU_LINK_AQUI';
```

## 📋 Funcionalidades

### Landing Page
- Estatísticas de aprovados (configuráveis pelo Marcos)
- Posts em destaque (selecionados pelo Marcos)
- Seção de ADMs
- Links sociais

### Blog
- Posts com limite de 2000 caracteres
- **Expiração automática de 6 meses**
- Tags predefinidas + tags criadas por usuários (ativadas após 3 usos)
- Upload de imagens (max 3) e arquivos (max 1)
- Likes, dislikes, comentários
- Filtros por tag, tempo, busca

### Wiki
- Estrutura hierárquica de pastas
- Artigos em Markdown
- Histórico de edições
- Bookmarks
- Contador de visualizações

### Questionário
- Perguntas hierárquicas (1 = mais importante)
- **Validação contra respostas vazias/inválidas**
- Se usuário responder com ".", "-", etc., o modal fecha mas na próxima vez mostra mensagem de validação
- Acesso ao WhatsApp liberado após completar todas as perguntas

### Dashboard Fundador
- **Configurar número de passes por Step** (aparece na landing)
- **Selecionar posts de Relato de Pass** para destaque na landing
- Ver todos os dados de todos os membros
- Exportar membros em CSV
- Gerenciar perguntas do questionário

## 🔒 Validação de Respostas

O sistema valida respostas contra padrões inválidos:
- Respostas vazias
- Apenas pontos, traços ou underscores
- Respostas muito curtas (< 3 caracteres)
- Padrões de teclado (asdf, qwerty)
- Respostas genéricas (n/a, teste, x)

Se uma resposta inválida for detectada, o modal fecha normalmente, mas na próxima vez que aparecer, mostrará a mesma pergunta com uma mensagem: "Nossa equipe avaliou sua resposta anterior e precisa que você forneça uma resposta mais completa."

## 🗄️ Limpeza Automática

### Posts Expirados
Execute periodicamente (via cron ou Supabase Edge Function):

```sql
SELECT cleanup_expired_posts();
```

## 📱 Responsividade

A plataforma é totalmente responsiva com breakpoints em:
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

## 🧪 Contas de Teste

Após executar os SQLs, as seguintes contas de fundador estarão disponíveis:

| Nome | Email | Senha |
|------|-------|-------|
| Marcos Vilela | mentor_marcos@gmail.com | privateers2024 |
| Iria Abreu | costamdiria@gmail.com | privateers2024 |

## 📞 Suporte

Para dúvidas ou sugestões:
- Instagram: @usmleprivateers
- YouTube: @usmleprivateers
- Email: contato@usmleprivateers.com

---

**Built with 💜 for Future Physicians**

© 2024 USMLE Privateers. All rights reserved.
