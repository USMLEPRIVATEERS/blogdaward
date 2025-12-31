# Ward Academy - Scripts SQL para Supabase

## Ordem de Execucao

Execute os arquivos SQL na seguinte ordem no Supabase SQL Editor:

1. `01_users.sql` - Tabela de usuarios e funcoes base
2. `02_user_data.sql` - Dados do questionario (11 tabelas)
3. `03_landmarks.sql` - Sistema de calls e marcos
4. `04_schedules.sql` - Cronogramas de estudo
5. `05_blog.sql` - Blog e comentarios
6. `06_research.sql` - Projetos de pesquisa
7. `07_diaries.sql` - Diarios de estudo e UWorld
8. `08_links.sql` - Repositorio de links
9. `09_messages.sql` - Sistema de mensagens
10. `10_rls_policies.sql` - Politicas de seguranca (RLS)
11. `11_seed_data.sql` - Dados iniciais (mentores e links)

## OU Execute Tudo de Uma Vez

Use o arquivo `99_run_all.sql` que executa todos os scripts na ordem correta.

## Credenciais Iniciais

Apos executar os scripts, os seguintes usuarios estarao disponiveis:

### Mentores
| Email | Senha | Funcao |
|-------|-------|--------|
| marcosantoniodv@gmail.com | ward2024 | Admin/TI |
| costamdiria@gmail.com | ward2024 | Mentora Principal |
| guilhermelavor@yahoo.com.br | ward2024 | Mentor Anki |
| romulossanglard@gmail.com | ward2024 | Mentor Pesquisa |

### Aluno Teste
| Email | Senha |
|-------|-------|
| aluno.teste@wardacademy.com | teste123 |

**IMPORTANTE:** Troque as senhas apos o primeiro login!

## Tabelas Criadas

### Usuarios e Autenticacao
- `users` - Usuarios do sistema
- `user_preparation_status` - Status de preparacao atual
- `daily_checkins` - Check-ins diarios

### Questionario (Steps 1-11)
- `user_basic_data` - Dados basicos
- `user_usmle_data` - Status USMLE
- `user_uworld_data` - Dados gerais UWorld
- `user_uworld_progress` - Progresso por system/category
- `user_english_level` - Nivel de ingles
- `user_anki_data` - Dados do Anki
- `user_research_data` - Dados de pesquisa
- `user_research_contacts` - Contatos de pesquisa
- `user_observerships` - Observerships
- `user_background` - Historia e objetivos

### Landmarks
- `landmarks` - Calls e marcos
- `landmark_types` - Tipos de landmarks

### Cronograma
- `schedules` - Cronograma de first pass
- `schedule_delays` - Sinalizacao de atrasos
- `usmle_systems` - Sistemas USMLE (referencia)
- `usmle_categories` - Categorias (referencia)

### Blog
- `blog_posts` - Posts
- `blog_comments` - Comentarios
- `blog_reactions` - Likes/dislikes

### Pesquisa
- `research_projects` - Projetos
- `research_tasks` - Tarefas (39 estagios)
- `research_stages` - Estagios de referencia
- `research_coauthors` - Coautores
- `research_notes` - Anotacoes

### Diarios
- `study_diary` - Diario de estudos
- `uworld_diary` - Diario UWorld
- `uworld_system_performance` - Performance por sistema
- `study_stats_daily` - Estatisticas diarias

### Links
- `link_categories` - Categorias de links
- `links_repository` - Repositorio de links
- `user_favorite_links` - Favoritos

### Mensagens
- `messages` - Mensagens
- `broadcast_messages` - Historico de broadcasts
- `notifications` - Notificacoes

## Notas Importantes

1. **RLS (Row Level Security):** As politicas RLS garantem que:
   - Alunos so veem seus proprios dados
   - Mentores veem dados de todos os alunos
   - Apenas mentor_marcos pode criar/deletar usuarios

2. **Indices:** Todos os indices necessarios ja estao criados para performance

3. **Triggers:** Triggers de `updated_at` estao configurados em todas as tabelas relevantes

4. **Funcoes:** Funcoes auxiliares como `update_updated_at_column()` e `is_mentor()` ja estao criadas
