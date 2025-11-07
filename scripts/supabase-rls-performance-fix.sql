-- 🚀 Supabase Database Linter RLS Performance Optimization
-- This script addresses specific performance issues identified by Supabase Database Linter
-- 
-- Issues Fixed:
-- 1. Auth RLS Initialization Plan (requests, profiles tables)
-- 2. Multiple Permissive Policies (Activity table)
-- 
-- Performance Improvements:
-- - Replace auth.uid() with (select auth.uid()) to prevent function re-evaluation
-- - Consolidate multiple permissive policies into efficient single policies
-- - Maintain security while optimizing performance

-- =============================================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- =============================================================================

-- Fix requests table policies
-- Issue: Service can update requests policy re-evaluating auth functions
DROP POLICY IF EXISTS "Service can update requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view their own requests." ON public.requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.requests;

-- Create optimized consolidated policy for requests table
CREATE POLICY "requests_user_access_optimized" ON public.requests
  FOR ALL
  USING ((select auth.uid()) = user_id);

-- Fix profiles table policies  
-- Issue: Service can update profiles policy re-evaluating auth functions
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create optimized consolidated policy for profiles table
CREATE POLICY "profiles_user_access_optimized" ON public.profiles
  FOR ALL
  USING ((select auth.uid()) = id);

-- Optional: Allow public read access for profiles if needed for user discovery
CREATE POLICY "profiles_public_read_optimized" ON public.profiles
  FOR SELECT
  USING (true);

-- =============================================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ISSUE (Activity table)
-- =============================================================================

-- Remove all existing Activity policies that are causing the 8 policies warning
DROP POLICY IF EXISTS "activities_own_record" ON public.Activity;
DROP POLICY IF EXISTS "activities_admin_access" ON public.Activity;
DROP POLICY IF EXISTS "activities_user_select" ON public.Activity;
DROP POLICY IF EXISTS "activities_user_insert" ON public.Activity;
DROP POLICY IF EXISTS "activities_user_update" ON public.Activity;
DROP POLICY IF EXISTS "activities_user_delete" ON public.Activity;
DROP POLICY IF EXISTS "activities_admin_select" ON public.Activity;
DROP POLICY IF EXISTS "activities_admin_insert" ON public.Activity;
DROP POLICY IF EXISTS "activities_admin_update" ON public.Activity;
DROP POLICY IF EXISTS "activities_admin_delete" ON public.Activity;
DROP POLICY IF EXISTS "activities_anon_access" ON public.Activity;
DROP POLICY IF EXISTS "activities_authenticated_access" ON public.Activity;

-- Create single optimized policy that handles both user and admin access
-- Users can access their own activities, admins can access all activities
CREATE POLICY "activities_optimized_access" ON public.Activity
  FOR ALL
  USING (
    -- User can access their own records
    ((select auth.uid())::text = "userId")
    OR
    -- Admin can access all records
    EXISTS (
      SELECT 1 FROM public."User" u 
      WHERE u.id = (select auth.uid())::text 
      AND u.role = 'admin'
    )
  );

-- =============================================================================
-- 3. OPTIMIZE OTHER CORE TABLES FOR CONSISTENCY
-- =============================================================================

-- User table optimization (consolidate multiple policies)
DROP POLICY IF EXISTS "users_own_record" ON public."User";
DROP POLICY IF EXISTS "users_select_own" ON public."User";
DROP POLICY IF EXISTS "users_update_own" ON public."User";

CREATE POLICY "users_optimized_access" ON public."User"
  FOR ALL
  USING ((select auth.uid())::text = id);

-- Session table optimization
DROP POLICY IF EXISTS "sessions_own_record" ON public."Session";

CREATE POLICY "sessions_optimized_access" ON public."Session"
  FOR ALL
  USING ((select auth.uid())::text = "userId");

-- Account table optimization
DROP POLICY IF EXISTS "accounts_own_record" ON public."Account";

CREATE POLICY "accounts_optimized_access" ON public."Account"
  FOR ALL
  USING ((select auth.uid())::text = "userId");

-- VerificationToken optimization (admin only access)
DROP POLICY IF EXISTS "verification_tokens_admin_only" ON public."VerificationToken";

CREATE POLICY "verification_tokens_optimized_admin" ON public."VerificationToken"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u 
      WHERE u.id = (select auth.uid())::text 
      AND u.role = 'admin'
    )
  );

-- =============================================================================
-- 4. OPTIMIZE CHAT SYSTEM TABLES (if they exist)
-- =============================================================================

-- Chat sessions optimization
DROP POLICY IF EXISTS "chat_sessions_own_record" ON public.chat_sessions;

-- Only create if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
    EXECUTE '
    CREATE POLICY "chat_sessions_optimized_access" ON public.chat_sessions
      FOR ALL
      USING ((select auth.uid())::text = user_id::text)
    ';
  END IF;
END $$;

-- Chat messages optimization
DROP POLICY IF EXISTS "chat_messages_own_sessions" ON public.chat_messages;

-- Only create if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE '
    CREATE POLICY "chat_messages_optimized_access" ON public.chat_messages
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.chat_sessions cs 
          WHERE cs.id::text = chat_messages.session_id::text 
          AND cs.user_id::text = (select auth.uid())::text
        )
      )
    ';
  END IF;
END $$;

-- =============================================================================
-- 5. OPTIMIZE SYSTEM TABLES
-- =============================================================================

-- Prisma migrations optimization (admin only)
DROP POLICY IF EXISTS "migrations_admin_only" ON public._prisma_migrations;

-- Only create if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = '_prisma_migrations') THEN
    EXECUTE '
    CREATE POLICY "migrations_optimized_admin" ON public._prisma_migrations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public."User" u 
          WHERE u.id = (select auth.uid())::text 
          AND u.role = ''admin''
        )
      )
    ';
  END IF;
END $$;

-- Legacy users table optimization (if exists)
DROP POLICY IF EXISTS "legacy_users_own_record" ON public.users;

-- Only create if table exists  
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE '
    CREATE POLICY "users_legacy_optimized_access" ON public.users
      FOR ALL
      USING ((select auth.uid())::text = id::text)
    ';
  END IF;
END $$;

-- =============================================================================
-- 6. VERIFICATION AND VALIDATION
-- =============================================================================

-- Function to verify optimization results
CREATE OR REPLACE FUNCTION public.verify_rls_optimization()
RETURNS TABLE(
  table_name text,
  policy_count bigint,
  has_optimized_auth_uid boolean,
  optimization_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pol.tablename::text as table_name,
    COUNT(*) as policy_count,
    BOOL_AND(pol.qual !~ 'auth\.uid\(\)' OR pol.qual ~ '\(select auth\.uid\(\)\)') as has_optimized_auth_uid,
    CASE 
      WHEN COUNT(*) <= 2 AND BOOL_AND(pol.qual !~ 'auth\.uid\(\)' OR pol.qual ~ '\(select auth\.uid\(\)\)')
      THEN '✅ OPTIMIZED'
      WHEN COUNT(*) > 3 
      THEN '⚠️ TOO MANY POLICIES'
      WHEN NOT BOOL_AND(pol.qual !~ 'auth\.uid\(\)' OR pol.qual ~ '\(select auth\.uid\(\)\)')
      THEN '⚠️ AUTH.UID() NOT OPTIMIZED'
      ELSE '❌ NEEDS REVIEW'
    END as optimization_status
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.tablename IN ('User', 'Activity', 'Session', 'Account', 'VerificationToken', 'profiles', 'requests')
  GROUP BY pol.tablename
  ORDER BY pol.tablename;
$$;

-- Run verification
SELECT * FROM public.verify_rls_optimization();

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 
  '🎉 RLS Performance Optimization Complete!' as status,
  '✅ Fixed auth.uid() performance issues' as fix_1,
  '✅ Consolidated multiple permissive policies' as fix_2,
  '✅ Optimized all core tables for better performance' as fix_3,
  '📊 Run verify_rls_optimization() to check results' as verification;