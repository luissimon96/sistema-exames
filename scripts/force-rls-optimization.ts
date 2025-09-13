#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceOptimization() {
  try {
    console.log('💪 Forçando Otimização RLS\n');

    const policies = [
      {
        table: 'Account',
        policy: 'accounts_own_record',
        sql: `CREATE POLICY "accounts_own_record" ON "Account" FOR ALL USING (((select auth.uid())::text = "userId"))`
      },
      {
        table: 'Activity',
        policy: 'activities_own_record', 
        sql: `CREATE POLICY "activities_own_record" ON "Activity" FOR ALL USING (((select auth.uid())::text = "userId"))`
      },
      {
        table: 'Activity',
        policy: 'activities_admin_access',
        sql: `CREATE POLICY "activities_admin_access" ON "Activity" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role = 'admin'))`
      },
      {
        table: 'Session',
        policy: 'sessions_own_record',
        sql: `CREATE POLICY "sessions_own_record" ON "Session" FOR ALL USING (((select auth.uid())::text = "userId"))`
      },
      {
        table: 'User',
        policy: 'users_own_record',
        sql: `CREATE POLICY "users_own_record" ON "User" FOR ALL USING (((select auth.uid())::text = id))`
      },
      {
        table: 'VerificationToken',
        policy: 'verification_tokens_admin_only',
        sql: `CREATE POLICY "verification_tokens_admin_only" ON "VerificationToken" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role = 'admin'))`
      },
      {
        table: '_prisma_migrations',
        policy: 'migrations_admin_only',
        sql: `CREATE POLICY "migrations_admin_only" ON "_prisma_migrations" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role = 'admin'))`
      },
      {
        table: 'chat_messages',
        policy: 'chat_messages_own_sessions',
        sql: `CREATE POLICY "chat_messages_own_sessions" ON "chat_messages" FOR ALL USING (EXISTS (SELECT 1 FROM chat_sessions cs WHERE cs.id::text = chat_messages.session_id::text AND cs.user_id::text = (select auth.uid())::text))`
      },
      {
        table: 'chat_sessions',
        policy: 'chat_sessions_own_record',
        sql: `CREATE POLICY "chat_sessions_own_record" ON "chat_sessions" FOR ALL USING (((select auth.uid())::text = user_id::text))`
      },
      {
        table: 'profiles',
        policy: 'Users can update their own profile.',
        sql: `CREATE POLICY "Users can update their own profile." ON "profiles" FOR UPDATE USING ((select auth.uid()) = id)`
      },
      {
        table: 'requests',
        policy: 'Users can view their own requests.',
        sql: `CREATE POLICY "Users can view their own requests." ON "requests" FOR SELECT USING ((select auth.uid()) = user_id)`
      },
      {
        table: 'users',
        policy: 'legacy_users_own_record',
        sql: `CREATE POLICY "legacy_users_own_record" ON "users" FOR ALL USING (((select auth.uid())::text = id::text))`
      }
    ];

    let successCount = 0;

    for (const policy of policies) {
      try {
        console.log(`🔧 Processando ${policy.table}.${policy.policy}...`);
        
        // Drop existing policy
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policy.policy}" ON "${policy.table}"`);
        
        // Create optimized policy
        await prisma.$executeRawUnsafe(policy.sql);
        
        console.log(`   ✅ Otimizada com sucesso`);
        successCount++;
        
      } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }

    console.log(`\n📊 Resultado: ${successCount}/${policies.length} políticas otimizadas\n`);

    // Validação final
    const optimizedPolicies = await prisma.$queryRaw`
      SELECT tablename, policyname
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND qual LIKE '%(select auth.uid())%'
    ` as Array<{tablename: string, policyname: string}>;

    console.log('✅ Políticas Otimizadas:');
    optimizedPolicies.forEach(p => {
      console.log(`   🚀 ${p.tablename}.${p.policyname}`);
    });

    const remainingUnoptimized = await prisma.$queryRaw`
      SELECT tablename, policyname
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND qual LIKE '%auth.uid()%'
      AND qual NOT LIKE '%(select auth.uid())%'
    ` as Array<{tablename: string, policyname: string}>;

    if (remainingUnoptimized.length > 0) {
      console.log('\n⚠️ Políticas Ainda Não Otimizadas:');
      remainingUnoptimized.forEach(p => {
        console.log(`   🐌 ${p.tablename}.${p.policyname}`);
      });
    }

    const performanceScore = optimizedPolicies.length / (optimizedPolicies.length + remainingUnoptimized.length) * 100;
    
    console.log(`\n🎯 Score Final: ${performanceScore.toFixed(0)}%`);
    
    if (performanceScore === 100) {
      console.log('🎉 TODAS AS POLÍTICAS FORAM OTIMIZADAS!');
      console.log('✅ Problemas de performance RLS resolvidos');
      console.log('📈 Alertas do Supabase Database Linter eliminados');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceOptimization();