-- 🔍 Validation Script: RLS Optimization Database Linter Fixes
-- Purpose: Verify the optimization scripts fix specific Supabase Database Linter warnings
-- Run this AFTER applying the RLS optimization to confirm fixes

-- =============================================================================
-- 1. VALIDATE AUTH RLS INITIALIZATION PLAN FIXES
-- =============================================================================

-- Check for auth.uid() usage patterns that cause performance warnings
SELECT 
  'Auth RLS Initialization Plan Check' as validation_type,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual ~ '\bauth\.uid\(\)' AND qual !~ '\(select auth\.uid\(\)\)' 
    THEN '❌ STILL USING auth.uid() - Performance Issue'
    WHEN qual ~ '\(select auth\.uid\(\)\)' 
    THEN '✅ USING (select auth.uid()) - Optimized'
    WHEN qual IS NULL OR qual !~ '\bauth\.uid'
    THEN '⚪ No auth.uid() usage'
    ELSE '⚠️ Mixed or Complex Usage'
  END as optimization_status,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('requests', 'profiles')
ORDER BY tablename, policyname;

-- =============================================================================
-- 2. VALIDATE MULTIPLE PERMISSIVE POLICIES FIX  
-- =============================================================================

-- Check policy count per table (should be minimal after optimization)
SELECT 
  'Multiple Permissive Policies Check' as validation_type,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OPTIMAL - Single Policy'
    WHEN COUNT(*) = 2 THEN '🟡 ACCEPTABLE - Two Policies' 
    WHEN COUNT(*) >= 3 AND COUNT(*) <= 5 THEN '⚠️ MANY POLICIES - Consider Consolidation'
    WHEN COUNT(*) > 5 THEN '❌ TOO MANY POLICIES - Performance Risk'
    ELSE '⚪ No Policies'
  END as policy_status,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY COUNT(*) DESC, tablename;

-- =============================================================================
-- 3. SPECIFIC ACTIVITY TABLE VALIDATION
-- =============================================================================

-- Detailed Activity table analysis (the main "Multiple Permissive Policies" issue)
SELECT 
  'Activity Table Specific Check' as validation_type,
  COUNT(*) as current_policy_count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ FIXED - Single Consolidated Policy'
    WHEN COUNT(*) BETWEEN 2 AND 3 THEN '🟡 IMPROVED - Reduced Policies'
    WHEN COUNT(*) >= 8 THEN '❌ NOT FIXED - Still Too Many Policies'
    ELSE '⚠️ UNEXPECTED STATE'
  END as fix_status,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as current_policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Activity';

-- =============================================================================
-- 4. PERFORMANCE VALIDATION QUERIES
-- =============================================================================

-- Check if optimized policies use efficient patterns
WITH policy_analysis AS (
  SELECT 
    tablename,
    policyname,
    -- Check for optimized auth.uid() usage
    CASE 
      WHEN qual ~ '\(select auth\.uid\(\)\)' THEN true
      WHEN qual ~ '\bauth\.uid\(\)' THEN false  
      ELSE NULL
    END as uses_optimized_auth_uid,
    -- Check for service role support
    qual ~ 'service_role' as has_service_role_support,
    qual
  FROM pg_policies 
  WHERE schemaname = 'public'
)
SELECT 
  'Performance Optimization Check' as validation_type,
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN uses_optimized_auth_uid = true THEN 1 END) as optimized_policies,
  COUNT(CASE WHEN uses_optimized_auth_uid = false THEN 1 END) as unoptimized_policies,
  COUNT(CASE WHEN has_service_role_support = true THEN 1 END) as policies_with_service_support,
  CASE 
    WHEN COUNT(CASE WHEN uses_optimized_auth_uid = false THEN 1 END) = 0 
    THEN '✅ ALL POLICIES OPTIMIZED'
    WHEN COUNT(CASE WHEN uses_optimized_auth_uid = false THEN 1 END) > 0
    THEN '❌ SOME POLICIES NOT OPTIMIZED'  
    ELSE '⚪ NO AUTH POLICIES'
  END as optimization_status
FROM policy_analysis
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- 5. SUPABASE DATABASE LINTER SIMULATION
-- =============================================================================

-- Simulate what Supabase Database Linter would check
WITH linter_checks AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count,
    -- Check for auth.uid() performance issues
    BOOL_AND(
      qual !~ '\bauth\.uid\(\)' OR qual ~ '\(select auth\.uid\(\)\)'
    ) as auth_uid_optimized,
    -- Check for excessive policy count
    COUNT(*) <= 3 as reasonable_policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  'Database Linter Simulation' as validation_type,
  tablename,
  policy_count,
  CASE 
    WHEN NOT auth_uid_optimized THEN '❌ Auth RLS Initialization Plan Warning'
    WHEN NOT reasonable_policy_count THEN '❌ Multiple Permissive Policies Warning'
    WHEN auth_uid_optimized AND reasonable_policy_count THEN '✅ No Linter Warnings'
    ELSE '⚠️ Unknown Status'
  END as linter_status,
  policies
FROM linter_checks
ORDER BY 
  CASE 
    WHEN NOT auth_uid_optimized OR NOT reasonable_policy_count THEN 1
    ELSE 2 
  END,
  tablename;

-- =============================================================================
-- 6. COMPREHENSIVE OPTIMIZATION SUMMARY
-- =============================================================================

-- Final optimization success report
WITH optimization_metrics AS (
  SELECT 
    COUNT(DISTINCT tablename) as tables_with_policies,
    SUM(CASE WHEN tablename = 'Activity' AND COUNT(*) = 1 THEN 1 ELSE 0 END) as activity_optimized,
    SUM(CASE WHEN tablename IN ('requests', 'profiles') AND 
             BOOL_AND(qual ~ '\(select auth\.uid\(\)\)') THEN 1 ELSE 0 END) as auth_tables_optimized,
    AVG(COUNT(*)) as avg_policies_per_table,
    MAX(COUNT(*)) as max_policies_per_table
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  '📊 RLS OPTIMIZATION VALIDATION SUMMARY' as report_section,
  tables_with_policies as total_tables,
  CASE 
    WHEN activity_optimized > 0 AND auth_tables_optimized > 0 
    THEN '✅ ALL MAJOR ISSUES FIXED'
    WHEN activity_optimized > 0 OR auth_tables_optimized > 0 
    THEN '🟡 PARTIALLY FIXED' 
    ELSE '❌ OPTIMIZATION NOT APPLIED'
  END as overall_status,
  ROUND(avg_policies_per_table::numeric, 2) as avg_policies_per_table,
  max_policies_per_table as max_policies_per_table,
  CASE 
    WHEN max_policies_per_table <= 2 THEN '✅ Excellent Policy Distribution'
    WHEN max_policies_per_table <= 4 THEN '🟡 Acceptable Policy Distribution'
    ELSE '❌ Some Tables Still Have Too Many Policies'
  END as policy_distribution_status
FROM optimization_metrics;

-- =============================================================================
-- 7. EXPECTED RESULTS AFTER SUCCESSFUL OPTIMIZATION
-- =============================================================================

-- Show what results should look like after successful optimization
SELECT '📋 EXPECTED RESULTS AFTER OPTIMIZATION' as info_section;

SELECT 
  'Expected Policy Counts' as metric,
  'Activity: 1 policy, requests: 1 policy, profiles: 1-2 policies' as expected_values,
  'All other tables: 1 policy each' as additional_info;

SELECT 
  'Expected Performance Status' as metric,
  'All policies should use (select auth.uid()) pattern' as expected_values,
  'No auth.uid() direct usage in policy conditions' as additional_info;

SELECT 
  'Expected Linter Status' as metric,
  'Zero warnings for Auth RLS Initialization Plan' as expected_values,
  'Zero warnings for Multiple Permissive Policies' as additional_info;

-- Run this validation script after applying the RLS optimization
-- All checks should show ✅ status for successful optimization