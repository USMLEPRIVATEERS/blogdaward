-- =============================================
-- WARD ACADEMY - FORCEFULLY DISABLE ALL RLS
-- Execute este script no Supabase SQL Editor
-- =============================================

-- Este script:
-- 1. Remove TODAS as policies existentes
-- 2. Desabilita RLS em TODAS as tabelas
-- 3. Concede permissoes ao anon role

-- =============================================
-- STEP 1: LISTAR TODAS AS TABELAS
-- =============================================

DO $$
DECLARE
    tbl RECORD;
    pol RECORD;
BEGIN
    -- Loop through all tables in public schema
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        -- Drop all policies on this table
        FOR pol IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = tbl.tablename
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl.tablename);
            RAISE NOTICE 'Dropped policy % on table %', pol.policyname, tbl.tablename;
        END LOOP;

        -- Disable RLS on this table
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Disabled RLS on table %', tbl.tablename;
    END LOOP;
END $$;

-- =============================================
-- STEP 2: GRANT ALL PERMISSIONS TO ANON
-- =============================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- STEP 3: VERIFICAR QUE RLS ESTA DESABILITADO
-- =============================================

SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Todas devem mostrar rowsecurity = false
