#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRLSPerformance() {
  try {
    console.log('⚡ Corrigindo Performance RLS\n');

    const fixes = [
      // Account
      {
        table: 'Account',
        drop: 'DROP POLICY IF EXISTS "accounts_own_record" ON "Account"',
        create: 'CREATE POLICY "accounts_own_record" ON "Account" FOR ALL USING ((((select auth.uid()))::text = "userId"))'
      },
      // Activity
      {
        table: 'Activity',
        drop: 'DROP POLICY IF EXISTS "activities_own_record" ON "Activity"',
        create: 'CREATE POLICY "activities_own_record" ON "Activity" FOR ALL USING ((((select auth.uid()))::text = "userId"))'
      },
      {
        table: 'Activity',
        drop: 'DROP POLICY IF EXISTS "activities_admin_access" ON "Activity"',
        create: 'CREATE POLICY "activities_admin_access" ON "Activity" FOR ALL USING ((EXISTS (SELECT 1 FROM "User" WHERE (("User".id = ((select auth.uid()))::text) AND ("User".role = \'admin\'::text)))))'
      },
      // Session
      {
        table: 'Session',
        drop: 'DROP POLICY IF EXISTS "sessions_own_record" ON "Session"',
        create: 'CREATE POLICY "sessions_own_record" ON "Session" FOR ALL USING ((((select auth.uid()))::text = "userId"))'
      },
      // User - consolidar em uma única política
      {
        table: 'User',
        drop: 'DROP POLICY IF EXISTS "users_own_record" ON "User"',
        create: 'CREATE POLICY "users_own_record" ON "User" FOR ALL USING ((((select auth.uid()))::text = id))'
      },
      // VerificationToken
      {
        table: 'VerificationToken',
        drop: 'DROP POLICY IF EXISTS "verification_tokens_admin_only" ON "VerificationToken"',
        create: 'CREATE POLICY "verification_tokens_admin_only" ON "VerificationToken" FOR ALL USING ((EXISTS (SELECT 1 FROM "User" WHERE (("User".id = ((select auth.uid()))::text) AND ("User".role = \'admin\'::text)))))'
      },
      // _prisma_migrations
      {
        table: '_prisma_migrations',
        drop: 'DROP POLICY IF EXISTS "migrations_admin_only" ON "_prisma_migrations"',
        create: 'CREATE POLICY "migrations_admin_only" ON "_prisma_migrations" FOR ALL USING ((EXISTS (SELECT 1 FROM "User" WHERE (("User".id = ((select auth.uid()))::text) AND ("User".role = \'admin\'::text)))))'
      },
      // chat_messages
      {
        table: 'chat_messages',
        drop: 'DROP POLICY IF EXISTS "chat_messages_own_sessions" ON "chat_messages"',
        create: 'CREATE POLICY "chat_messages_own_sessions" ON "chat_messages" FOR ALL USING ((EXISTS (SELECT 1 FROM chat_sessions cs WHERE (((cs.id)::text = (chat_messages.session_id)::text) AND ((cs.user_id)::text = ((select auth.uid()))::text)))))'
      },
      // chat_sessions
      {
        table: 'chat_sessions',
        drop: 'DROP POLICY IF EXISTS "chat_sessions_own_record" ON "chat_sessions"',
        create: 'CREATE POLICY "chat_sessions_own_record" ON "chat_sessions" FOR ALL USING ((((select auth.uid()))::text = (user_id)::text))'
      },
      // profiles
      {
        table: 'profiles',
        drop: 'DROP POLICY IF EXISTS "Users can update their own profile." ON "profiles"',
        create: 'CREATE POLICY "Users can update their own profile." ON "profiles" FOR UPDATE USING (((select auth.uid()) = id))'
      },
      // requests
      {
        table: 'requests',
        drop: 'DROP POLICY IF EXISTS "Users can view their own requests." ON "requests"',
        create: 'CREATE POLICY "Users can view their own requests." ON "requests" FOR SELECT USING (((select auth.uid()) = user_id))'
      },
      // users (legacy)
      {
        table: 'users',
        drop: 'DROP POLICY IF EXISTS "legacy_users_own_record" ON "users"',
        create: 'CREATE POLICY "legacy_users_own_record" ON "users" FOR ALL USING ((((select auth.uid()))::text = (id)::text))'
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const fix of fixes) {
      try {
        // Drop existing policy
        await prisma.$executeRawUnsafe(fix.drop);
        
        // Create optimized policy  
        await prisma.$executeRawUnsafe(fix.create);
        
        console.log(`✅ ${fix.table}: Otimizada`);
        successCount++;
        
      } catch (error: any) {
        console.log(`❌ ${fix.table}: ${error.message}`);
        errorCount++;
      }
    }

    // Remove duplicate policies
    console.log('\n🔧 Removendo políticas duplicadas:');
    
    try {
      await prisma.$executeRawUnsafe('DROP POLICY IF EXISTS "users_select_own" ON "User"');
      await prisma.$executeRawUnsafe('DROP POLICY IF EXISTS "users_update_own" ON "User"'); 
      console.log('✅ User: Políticas duplicadas removidas');
    } catch (error: any) {
      console.log(`❌ User duplicates: ${error.message}`);
    }

    console.log(`\n📊 Resumo:`);
    console.log(`✅ Políticas otimizadas: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    // Verificação final
    const remainingAuthUid = await prisma.$queryRaw`
      SELECT tablename, policyname, qual 
      FROM pg_policies 
      WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%'
    ` as Array<{tablename: string, policyname: string, qual: string}>;

    if (remainingAuthUid.length > 0) {
      console.log(`\n⚠️ auth.uid() não otimizados restantes: ${remainingAuthUid.length}`);
      remainingAuthUid.forEach(p => {
        console.log(`   ${p.tablename}.${p.policyname}`);
      });
    } else {
      console.log('\n🎉 Todas as políticas foram otimizadas!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRLSPerformance();