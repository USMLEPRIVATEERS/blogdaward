-- Verificar tipos das colunas nas tabelas do blog
SELECT
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name IN ('blog_comments', 'blog_posts', 'users', 'blog_reactions')
    AND column_name IN ('id', 'post_id', 'user_id', 'comment_id')
ORDER BY table_name, column_name;
