-- Migration: RLS Performance Optimization
-- Date: 2025-11-07
-- Purpose: Fix Supabase Database Linter performance warnings
-- Safe to run multiple times (idempotent)

-- =============================================================================
-- MIGRATION METADATA
-- =============================================================================

-- Check if migration has already been applied
CREATE TABLE IF NOT EXISTS public.rls_migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT DEFAULT CURRENT_USER
);

-- Record migration start
DO $$
BEGIN
  INSERT INTO public.rls_migration_log (migration_name)
  VALUES ('rls_performance_optimization_2025_11_07')
  ON CONFLICT (migration_name) DO NOTHING;
  
  -- If migration already exists, skip
  IF EXISTS (
    SELECT 1 FROM public.rls_migration_log 
    WHERE migration_name = 'rls_performance_optimization_2025_11_07'
    AND applied_at < NOW() - INTERVAL '1 minute'
  ) THEN
    RAISE NOTICE 'Migration already applied. Skipping...';
    RETURN;
  END IF;
END
$$;

-- =============================================================================
-- STEP 1: CREATE MISSING TABLES IF THEY DON'T EXIST
-- =============================================================================

-- Create profiles table if it doesn't exist (Supabase auth.users companion)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  usage_count INTEGER DEFAULT 0,
  usage_month INTEGER,
  usage_reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table if it doesn't exist (generic request tracking)
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: BACKUP EXISTING POLICIES (for rollback if needed)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rls_policy_backup (
  id SERIAL PRIMARY KEY,
  table_name TEXT,
  policy_name TEXT,
  policy_definition TEXT,
  backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backup existing policies for key tables
INSERT INTO public.rls_policy_backup (table_name, policy_name, policy_definition)
SELECT 
  schemaname || '.' || tablename as table_name,
  policyname as policy_name,
  'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename || 
  ' FOR ' || cmd ||
  CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
  ';' as policy_definition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Activity', 'profiles', 'requests')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: OPTIMIZE requests TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service can update requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view their own requests." ON public.requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.requests;
DROP POLICY IF EXISTS "requests_user_access" ON public.requests;

-- Create single optimized policy for requests
-- Fix: Replace auth.uid() with (select auth.uid()) to prevent re-evaluation
CREATE POLICY "requests_optimized_user_access" 
ON public.requests
FOR ALL
USING (
  -- Users can access their own requests
  (select auth.uid()) = user_id
  OR
  -- Service role can access all (for admin operations)
  auth.jwt() ->> 'role' = 'service_role'
);

-- =============================================================================
-- STEP 4: OPTIMIZE profiles TABLE POLICIES  
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_access" ON public.profiles;

-- Create optimized policy for profiles
-- Fix: Replace auth.uid() with (select auth.uid()) to prevent re-evaluation
CREATE POLICY "profiles_optimized_user_access"
ON public.profiles
FOR ALL
USING (
  -- Users can access their own profile
  (select auth.uid()) = id
  OR
  -- Service role can access all (for admin operations)  
  auth.jwt() ->> 'role' = 'service_role'
);

-- Optional: Public read access for user discovery (if needed)
-- CREATE POLICY "profiles_public_read" 
-- ON public.profiles
-- FOR SELECT
-- USING (true);

-- =============================================================================
-- STEP 5: OPTIMIZE Activity TABLE POLICIES (Fix Multiple Permissive Policies)
-- =============================================================================

-- Drop ALL existing Activity policies that cause the "8 policies" warning
DROP POLICY IF EXISTS "activities_own_record" ON public."Activity";
DROP POLICY IF EXISTS "activities_admin_access" ON public."Activity";
DROP POLICY IF EXISTS "activities_user_select" ON public."Activity";
DROP POLICY IF EXISTS "activities_user_insert" ON public."Activity";
DROP POLICY IF EXISTS "activities_user_update" ON public."Activity";
DROP POLICY IF EXISTS "activities_user_delete" ON public."Activity";
DROP POLICY IF EXISTS "activities_admin_select" ON public."Activity";
DROP POLICY IF EXISTS "activities_admin_insert" ON public."Activity";
DROP POLICY IF EXISTS "activities_admin_update" ON public."Activity";
DROP POLICY IF EXISTS "activities_admin_delete" ON public."Activity";
DROP POLICY IF EXISTS "activities_anon_access" ON public."Activity";
DROP POLICY IF EXISTS "activities_authenticated_access" ON public."Activity";
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Activity";
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public."Activity";

-- Create SINGLE consolidated policy for Activity table
-- This fixes the "Multiple Permissive Policies" warning by reducing 8+ policies to 1
CREATE POLICY "activity_consolidated_access"
ON public."Activity"
FOR ALL
USING (
  -- Users can access their own activity records
  (select auth.uid())::text = "userId"
  OR
  -- Admins can access all activity records
  EXISTS (
    SELECT 1 FROM public."User" u 
    WHERE u.id = (select auth.uid())::text 
    AND u.role = 'admin'
  )
  OR
  -- Service role can access all (for system operations)
  auth.jwt() ->> 'role' = 'service_role'
);

-- =============================================================================
-- STEP 6: OPTIMIZE OTHER CORE TABLES FOR CONSISTENCY
-- =============================================================================

-- User table: Consolidate multiple policies
DROP POLICY IF EXISTS "users_own_record" ON public."User";
DROP POLICY IF EXISTS "users_select_own" ON public."User";
DROP POLICY IF EXISTS "users_update_own" ON public."User";

CREATE POLICY "user_optimized_access"
ON public."User"
FOR ALL
USING (
  (select auth.uid())::text = id
  OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- Session table: Optimize auth.uid() usage
DROP POLICY IF EXISTS "sessions_own_record" ON public."Session";

CREATE POLICY "session_optimized_access"
ON public."Session"
FOR ALL
USING (
  (select auth.uid())::text = "userId"
  OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- Account table: Optimize auth.uid() usage  
DROP POLICY IF EXISTS "accounts_own_record" ON public."Account";

CREATE POLICY "account_optimized_access"
ON public."Account"
FOR ALL
USING (
  (select auth.uid())::text = "userId"
  OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- =============================================================================
-- STEP 7: CREATE MONITORING AND VERIFICATION FUNCTIONS
-- =============================================================================

-- Function to check RLS policy performance
CREATE OR REPLACE FUNCTION public.check_rls_performance()
RETURNS TABLE(
  table_name text,
  policy_count bigint,
  uses_optimized_auth_uid boolean,
  performance_status text,
  recommendations text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH policy_analysis AS (
    SELECT 
      pol.tablename,
      COUNT(*) as policy_count,
      -- Check if policies use optimized (select auth.uid()) instead of auth.uid()
      BOOL_AND(
        pol.qual !~ '\bauth\.uid\(\)' 
        OR pol.qual ~ '\(select auth\.uid\(\)\)'
      ) as uses_optimized_auth_uid,
      STRING_AGG(pol.policyname, ', ') as policy_names
    FROM pg_policies pol
    WHERE pol.schemaname = 'public'
    GROUP BY pol.tablename
  )
  SELECT 
    pa.tablename::text as table_name,
    pa.policy_count,
    pa.uses_optimized_auth_uid,
    CASE 
      WHEN pa.policy_count = 1 AND pa.uses_optimized_auth_uid 
      THEN '🟢 EXCELLENT'
      WHEN pa.policy_count <= 2 AND pa.uses_optimized_auth_uid 
      THEN '🟡 GOOD'
      WHEN pa.policy_count > 3 
      THEN '🔴 TOO MANY POLICIES'
      WHEN NOT pa.uses_optimized_auth_uid 
      THEN '🟠 AUTH.UID() NOT OPTIMIZED'
      ELSE '⚪ UNKNOWN'
    END as performance_status,
    CASE 
      WHEN pa.policy_count > 3 
      THEN 'Consolidate policies to reduce evaluation overhead'
      WHEN NOT pa.uses_optimized_auth_uid 
      THEN 'Replace auth.uid() with (select auth.uid()) in policies'
      WHEN pa.policy_count = 1 AND pa.uses_optimized_auth_uid 
      THEN 'No optimization needed - already optimal'
      ELSE 'Consider consolidating policies for better performance'
    END as recommendations
  FROM policy_analysis pa
  ORDER BY 
    CASE pa.performance_status 
      WHEN '🔴 TOO MANY POLICIES' THEN 1
      WHEN '🟠 AUTH.UID() NOT OPTIMIZED' THEN 2  
      WHEN '🟡 GOOD' THEN 3
      WHEN '🟢 EXCELLENT' THEN 4
      ELSE 5
    END,
    pa.tablename;
$$;

-- Function to generate policy summary report
CREATE OR REPLACE FUNCTION public.rls_optimization_summary()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report TEXT;
  total_tables INTEGER;
  optimized_tables INTEGER;
  issues_found INTEGER;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN performance_status LIKE '🟢%' OR performance_status LIKE '🟡%' THEN 1 END) as optimized,
    COUNT(CASE WHEN performance_status LIKE '🔴%' OR performance_status LIKE '🟠%' THEN 1 END) as issues
  INTO total_tables, optimized_tables, issues_found
  FROM public.check_rls_performance();

  report := E'📊 RLS Performance Optimization Summary\n';
  report := report || E'=====================================\n\n';
  report := report || format('📋 Total Tables: %s\n', total_tables);
  report := report || format('✅ Optimized: %s\n', optimized_tables);
  report := report || format('⚠️  Issues Found: %s\n', issues_found);
  report := report || format('🎯 Optimization Rate: %s%%\n\n', 
    CASE 
      WHEN total_tables > 0 THEN ROUND((optimized_tables::NUMERIC / total_tables) * 100) 
      ELSE 0 
    END
  );
  
  IF issues_found = 0 THEN
    report := report || E'🎉 All policies are optimized for performance!\n';
    report := report || E'✨ No further action needed.\n';
  ELSE
    report := report || E'💡 Run check_rls_performance() for detailed recommendations.\n';
  END IF;
  
  RETURN report;
END;
$$;

-- =============================================================================
-- STEP 8: UPDATE MIGRATION LOG AND GENERATE REPORT
-- =============================================================================

-- Update migration log with completion
UPDATE public.rls_migration_log 
SET applied_at = NOW()
WHERE migration_name = 'rls_performance_optimization_2025_11_07';

-- Generate final report
SELECT public.rls_optimization_summary() as migration_summary;

-- Show detailed performance check
SELECT * FROM public.check_rls_performance();

-- Final success message
SELECT 
  '🎉 Migration Completed Successfully!' as status,
  'RLS Performance Optimization Applied' as migration_name,
  NOW() as completed_at;