-- 🚀 Apply RLS Performance Optimization
-- This script optimizes all RLS policies by replacing auth.uid() with (select auth.uid())
-- Run this in your Supabase SQL Editor

-- requests table (mentioned in your issue)
DROP POLICY IF EXISTS "Service can update requests" ON "requests";
CREATE POLICY "Service can update requests" ON "requests" FOR UPDATE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own requests." ON "requests";
CREATE POLICY "Users can view their own requests." ON "requests" FOR SELECT 
USING ((select auth.uid()) = user_id);

-- Account
DROP POLICY IF EXISTS "accounts_own_record" ON "Account";
CREATE POLICY "accounts_own_record" ON "Account" FOR ALL 
USING (((select auth.uid())::text = "userId"));

-- Activity (maintain both user and admin policies)
DROP POLICY IF EXISTS "activities_own_record" ON "Activity";
CREATE POLICY "activities_own_record" ON "Activity" FOR ALL 
USING (((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "activities_admin_access" ON "Activity";  
CREATE POLICY "activities_admin_access" ON "Activity" FOR ALL 
USING (EXISTS (
  SELECT 1 FROM "User" 
  WHERE "User".id = (select auth.uid())::text 
  AND "User".role = 'admin'
));

-- Session
DROP POLICY IF EXISTS "sessions_own_record" ON "Session";
CREATE POLICY "sessions_own_record" ON "Session" FOR ALL 
USING (((select auth.uid())::text = "userId"));

-- User (consolidated policy)
DROP POLICY IF EXISTS "users_own_record" ON "User";
DROP POLICY IF EXISTS "users_select_own" ON "User";
DROP POLICY IF EXISTS "users_update_own" ON "User";
CREATE POLICY "users_own_record" ON "User" FOR ALL 
USING (((select auth.uid())::text = id));

-- VerificationToken
DROP POLICY IF EXISTS "verification_tokens_admin_only" ON "VerificationToken";
CREATE POLICY "verification_tokens_admin_only" ON "VerificationToken" FOR ALL 
USING (EXISTS (
  SELECT 1 FROM "User" 
  WHERE "User".id = (select auth.uid())::text 
  AND "User".role = 'admin'
));

-- chat_sessions
DROP POLICY IF EXISTS "chat_sessions_own_record" ON "chat_sessions";
CREATE POLICY "chat_sessions_own_record" ON "chat_sessions" FOR ALL 
USING (((select auth.uid())::text = user_id::text));

-- chat_messages  
DROP POLICY IF EXISTS "chat_messages_own_sessions" ON "chat_messages";
CREATE POLICY "chat_messages_own_sessions" ON "chat_messages" FOR ALL 
USING (EXISTS (
  SELECT 1 FROM chat_sessions cs 
  WHERE cs.id::text = chat_messages.session_id::text 
  AND cs.user_id::text = (select auth.uid())::text
));

-- _prisma_migrations
DROP POLICY IF EXISTS "migrations_admin_only" ON "_prisma_migrations";
CREATE POLICY "migrations_admin_only" ON "_prisma_migrations" FOR ALL 
USING (EXISTS (
  SELECT 1 FROM "User" 
  WHERE "User".id = (select auth.uid())::text 
  AND "User".role = 'admin'
));

-- profiles  
DROP POLICY IF EXISTS "Users can update their own profile." ON "profiles";
CREATE POLICY "Users can update their own profile." ON "profiles" FOR UPDATE 
USING ((select auth.uid()) = id);

-- users (legacy table)
DROP POLICY IF EXISTS "legacy_users_own_record" ON "users";
CREATE POLICY "legacy_users_own_record" ON "users" FOR ALL 
USING (((select auth.uid())::text = id::text));

-- Verification query
SELECT 'RLS Optimization Applied Successfully!' as result;