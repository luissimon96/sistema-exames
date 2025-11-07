-- Rollback Script: RLS Performance Optimization
-- Date: 2025-11-07
-- Purpose: Rollback RLS optimization if needed
-- Run this if the optimization causes any issues

-- =============================================================================
-- ROLLBACK PREPARATION
-- =============================================================================

-- Check if migration was applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rls_migration_log 
    WHERE migration_name = 'rls_performance_optimization_2025_11_07'
  ) THEN
    RAISE NOTICE 'Migration was not applied. Nothing to rollback.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting rollback of RLS Performance Optimization...';
END
$$;

-- =============================================================================
-- STEP 1: RESTORE ORIGINAL POLICIES FROM BACKUP
-- =============================================================================

-- Function to restore policies from backup
CREATE OR REPLACE FUNCTION public.restore_policies_from_backup()
RETURNS TABLE(
  restored_table text,
  restored_policy text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_record RECORD;
  restore_sql TEXT;
BEGIN
  FOR backup_record IN 
    SELECT table_name, policy_name, policy_definition 
    FROM public.rls_policy_backup
    ORDER BY table_name, policy_name
  LOOP
    BEGIN
      -- Execute the restore
      EXECUTE backup_record.policy_definition;
      
      RETURN QUERY SELECT 
        backup_record.table_name,
        backup_record.policy_name,
        'RESTORED'::text;
        
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        backup_record.table_name,
        backup_record.policy_name,
        ('ERROR: ' || SQLERRM)::text;
    END;
  END LOOP;
END;
$$;

-- =============================================================================
-- STEP 2: REMOVE OPTIMIZED POLICIES
-- =============================================================================

-- Remove optimized requests policies
DROP POLICY IF EXISTS "requests_optimized_user_access" ON public.requests;

-- Remove optimized profiles policies  
DROP POLICY IF EXISTS "profiles_optimized_user_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- Remove optimized Activity policy
DROP POLICY IF EXISTS "activity_consolidated_access" ON public."Activity";

-- Remove optimized core table policies
DROP POLICY IF EXISTS "user_optimized_access" ON public."User";
DROP POLICY IF EXISTS "session_optimized_access" ON public."Session";
DROP POLICY IF EXISTS "account_optimized_access" ON public."Account";

-- =============================================================================
-- STEP 3: RESTORE ORIGINAL POLICIES
-- =============================================================================

-- Restore Activity table policies (original multiple policies)
-- Note: This will restore the "Multiple Permissive Policies" issue but ensures compatibility

-- Users can only see their own activities
CREATE POLICY "activities_own_record" ON public."Activity"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Admins can see all activities  
CREATE POLICY "activities_admin_access" ON public."Activity"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Restore requests table policies (original with auth.uid())
CREATE POLICY "Service can update requests" ON public.requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests." ON public.requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Restore profiles table policies (original with auth.uid())
CREATE POLICY "Users can update their own profile." ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Restore User table policies (original multiple policies)
CREATE POLICY "users_own_record" ON public."User"
  FOR ALL
  USING (auth.uid()::text = id);

CREATE POLICY "users_select_own" ON public."User"
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "users_update_own" ON public."User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Restore Session table policies (original with auth.uid())
CREATE POLICY "sessions_own_record" ON public."Session"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Restore Account table policies (original with auth.uid())
CREATE POLICY "accounts_own_record" ON public."Account"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- =============================================================================
-- STEP 4: RESTORE FROM BACKUP (if backup exists)
-- =============================================================================

-- Attempt to restore any backed up policies
SELECT * FROM public.restore_policies_from_backup();

-- =============================================================================
-- STEP 5: CLEANUP OPTIMIZATION ARTIFACTS
-- =============================================================================

-- Remove optimization functions
DROP FUNCTION IF EXISTS public.check_rls_performance();
DROP FUNCTION IF EXISTS public.rls_optimization_summary();
DROP FUNCTION IF EXISTS public.restore_policies_from_backup();

-- Mark rollback in migration log
INSERT INTO public.rls_migration_log (migration_name)
VALUES ('rls_performance_optimization_2025_11_07_ROLLBACK')
ON CONFLICT (migration_name) DO NOTHING;

-- =============================================================================
-- STEP 6: VERIFICATION
-- =============================================================================

-- Verify rollback by checking policy count
WITH policy_counts AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  tablename as table_name,
  policy_count,
  CASE 
    WHEN tablename = 'Activity' AND policy_count >= 2 THEN '✅ MULTIPLE POLICIES RESTORED'
    WHEN tablename IN ('requests', 'profiles') AND policy_count >= 1 THEN '✅ ORIGINAL POLICIES RESTORED'  
    ELSE '⚠️ CHECK MANUALLY'
  END as rollback_status
FROM policy_counts
WHERE tablename IN ('Activity', 'requests', 'profiles', 'User', 'Session', 'Account')
ORDER BY tablename;

-- Final rollback confirmation
SELECT 
  '🔄 Rollback Completed' as status,
  '⚠️ RLS Performance issues may reappear' as warning,
  '💡 Original policies have been restored' as note,
  NOW() as rollback_completed_at;