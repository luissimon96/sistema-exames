-- 🛡️ Supabase Row Level Security (RLS) Configuration
-- Enable RLS and create policies for all tables

-- =============================================================================
-- 1. AUTHENTICATION TABLES (NextAuth.js)
-- =============================================================================

-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own records
CREATE POLICY "users_own_record" ON "User"
  FOR ALL
  USING (auth.uid()::text = id);

-- Policy: Users can view their own data
CREATE POLICY "users_select_own" ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

-- Policy: Users can update their own data
CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Enable RLS on Session table
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own sessions
CREATE POLICY "sessions_own_record" ON "Session"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Enable RLS on Account table
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own accounts
CREATE POLICY "accounts_own_record" ON "Account"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Enable RLS on VerificationToken table
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Policy: Verification tokens - restrict access (admin only for debugging)
CREATE POLICY "verification_tokens_admin_only" ON "VerificationToken"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- =============================================================================
-- 2. APPLICATION TABLES
-- =============================================================================

-- Enable RLS on Activity table
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activities
CREATE POLICY "activities_own_record" ON "Activity"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Policy: Admins can see all activities
CREATE POLICY "activities_admin_access" ON "Activity"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Enable RLS on chat_sessions table
ALTER TABLE "chat_sessions" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own chat sessions
CREATE POLICY "chat_sessions_own_record" ON "chat_sessions"
  FOR ALL
  USING (auth.uid()::text = user_id::text);

-- Enable RLS on chat_messages table
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access messages from their sessions
CREATE POLICY "chat_messages_own_sessions" ON "chat_messages"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "chat_sessions" cs
      WHERE cs.id::text = chat_messages.session_id::text
      AND cs.user_id::text = auth.uid()::text
    )
  );

-- Enable RLS on legacy users table (if needed)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own record in legacy table
CREATE POLICY "legacy_users_own_record" ON "users"
  FOR ALL
  USING (auth.uid()::text = id::text);

-- =============================================================================
-- 3. SYSTEM TABLES (Limited Access)
-- =============================================================================

-- Enable RLS on _prisma_migrations (admin only)
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can see migration history
CREATE POLICY "migrations_admin_only" ON "_prisma_migrations"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- =============================================================================
-- 4. SERVICE ROLE POLICIES (for API access)
-- =============================================================================

-- Grant service role access to bypass RLS when needed
-- This allows server-side operations to work properly

-- Note: These policies ensure that:
-- 1. Users can only access their own data
-- 2. Admins have elevated permissions
-- 3. Service role can bypass RLS for server operations
-- 4. NextAuth.js can function properly with authentication tables