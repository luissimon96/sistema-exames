-- Database Verification Script for Supabase/PostgreSQL
-- This script can be run directly in the Supabase SQL editor
-- or via psql command line tool

-- Check database connection and basic info
SELECT 
    current_database() as database_name,
    current_user as connected_user,
    version() as postgresql_version,
    now() as current_timestamp;

-- Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get detailed table information
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check User table structure and data
SELECT 
    'User Table Analysis' as analysis_type,
    COUNT(*) as total_records
FROM "User";

-- List all users (for verification)
SELECT 
    id,
    email,
    name,
    role,
    "isActive",
    "createdAt",
    "lastLogin"
FROM "User"
ORDER BY "createdAt" DESC;

-- Check for target user
SELECT 
    'Target User Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "User" WHERE email = 'luissimon96@gmail.com') 
        THEN 'EXISTS' 
        ELSE 'NOT_FOUND' 
    END as status;

-- Get target user details if exists
SELECT 
    id,
    email,
    name,
    role,
    "isActive",
    "createdAt",
    "lastLogin",
    "loginCount",
    "subscriptionStatus"
FROM "User" 
WHERE email = 'luissimon96@gmail.com';

-- Check Sessions table
SELECT 
    'Session Table Analysis' as analysis_type,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN expires > NOW() THEN 1 END) as active_sessions,
    COUNT(CASE WHEN expires <= NOW() THEN 1 END) as expired_sessions
FROM "Session";

-- Check Accounts table (OAuth providers)
SELECT 
    'Account Table Analysis' as analysis_type,
    COUNT(*) as total_accounts,
    provider,
    COUNT(*) as count_per_provider
FROM "Account"
GROUP BY provider;

-- Check Activity logs
SELECT 
    'Activity Table Analysis' as analysis_type,
    COUNT(*) as total_activities,
    action,
    COUNT(*) as count_per_action
FROM "Activity"
GROUP BY action
ORDER BY count_per_action DESC;

-- Recent activities (last 10)
SELECT 
    a.action,
    a.details,
    a."createdAt",
    u.email as user_email
FROM "Activity" a
JOIN "User" u ON a."userId" = u.id
ORDER BY a."createdAt" DESC
LIMIT 10;

-- Check VerificationToken table
SELECT 
    'VerificationToken Table Analysis' as analysis_type,
    COUNT(*) as total_tokens,
    COUNT(CASE WHEN expires > NOW() THEN 1 END) as valid_tokens,
    COUNT(CASE WHEN expires <= NOW() THEN 1 END) as expired_tokens
FROM "VerificationToken";

-- Database size and performance metrics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Connection and configuration check
SELECT 
    'Database Configuration' as check_type,
    setting as max_connections
FROM pg_settings 
WHERE name = 'max_connections'
UNION ALL
SELECT 
    'SSL Status',
    CASE 
        WHEN ssl = true THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END
FROM pg_stat_ssl 
WHERE pid = pg_backend_pid();

-- Final summary
SELECT 
    'Database Health Summary' as summary,
    (SELECT COUNT(*) FROM "User") as total_users,
    (SELECT COUNT(*) FROM "Session" WHERE expires > NOW()) as active_sessions,
    (SELECT COUNT(*) FROM "Account") as oauth_accounts,
    (SELECT COUNT(*) FROM "Activity") as logged_activities,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "User" WHERE email = 'luissimon96@gmail.com') 
        THEN 'TARGET_USER_FOUND' 
        ELSE 'TARGET_USER_MISSING' 
    END as target_user_status;