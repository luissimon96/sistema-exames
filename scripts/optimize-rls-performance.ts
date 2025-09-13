#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizeRLSPerformance() {
  try {
    console.log('⚡ Otimizando Performance das Políticas RLS\n');

    // 1. Aplicar otimizações auth.uid()
    console.log('🔧 1. Otimizando chamadas auth.uid():');
    
    const optimizations = [
      {
        table: 'Account',
        policy: 'accounts_own_record',
        type: 'ALL',
        condition: `(((select auth.uid()))::text = "userId")`
      },
      {
        table: 'Activity', 
        policy: 'activities_own_record',
        type: 'ALL',
        condition: `(((select auth.uid()))::text = "userId")`
      },
      {
        table: 'Activity',
        policy: 'activities_admin_access',
        type: 'ALL', 
        condition: `(EXISTS ( SELECT 1 FROM "User" WHERE (("User".id = ((select auth.uid()))::text) AND ("User".role = 'admin'::text))))`
      },
      {
        table: 'Session',
        policy: 'sessions_own_record',
        type: 'ALL',
        condition: `(((select auth.uid()))::text = "userId")`
      },
      {
        table: 'User',
        policy: 'users_own_record', 
        type: 'ALL',
        condition: `(((select auth.uid()))::text = id)`
      },
      {
        table: 'User',
        policy: 'users_select_own',
        type: 'SELECT',
        condition: `(((select auth.uid()))::text = id)`
      },
      {
        table: 'User', 
        policy: 'users_update_own',
        type: 'UPDATE',
        condition: `(((select auth.uid()))::text = id)`
      },
      {
        table: 'VerificationToken',
        policy: 'verification_tokens_admin_only',
        type: 'ALL',
        condition: `(EXISTS ( SELECT 1 FROM "User" WHERE (("User".id = ((select auth.uid()))::text) AND ("User".role = 'admin'::text))))`
      },
      {
        table: '_prisma_migrations',
        policy: 'migrations_admin_only', 
        type: 'ALL',
        condition: `(EXISTS ( SELECT 1 FROM "User" WHERE (("User".id = ((select auth.uid()))::text) AND ("User".role = 'admin'::text))))`
      },
      {
        table: 'chat_messages',
        policy: 'chat_messages_own_sessions',
        type: 'ALL',
        condition: `(EXISTS ( SELECT 1 FROM chat_sessions cs WHERE (((cs.id)::text = (chat_messages.session_id)::text) AND ((cs.user_id)::text = ((select auth.uid()))::text))))`
      },
      {
        table: 'chat_sessions',
        policy: 'chat_sessions_own_record',
        type: 'ALL', 
        condition: `(((select auth.uid()))::text = (user_id)::text)`
      },
      {
        table: 'profiles',
        policy: 'Users can update their own profile.',
        type: 'UPDATE',
        condition: `((select auth.uid()) = id)`
      },
      {
        table: 'requests',
        policy: 'Users can view their own requests.',
        type: 'SELECT',
        condition: `((select auth.uid()) = user_id)`
      },
      {
        table: 'users',
        policy: 'legacy_users_own_record',
        type: 'ALL',
        condition: `(((select auth.uid()))::text = (id)::text)`
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const opt of optimizations) {
      try {
        // Dropar política existente
        await prisma.$executeRaw`
          SELECT format('DROP POLICY IF EXISTS %I ON %I', ${opt.policy}, ${opt.table})
        `.then(async (result: any) => {
          const dropSQL = (result as any[])[0].format;
          await prisma.$executeRawUnsafe(dropSQL);
        });

        // Criar política otimizada
        const createSQL = `CREATE POLICY "${opt.policy}" ON "${opt.table}" FOR ${opt.type} USING ${opt.condition}`;
        await prisma.$executeRawUnsafe(createSQL);
        
        console.log(`   ✅ ${opt.table}.${opt.policy}`);
        successCount++;
        
      } catch (error: any) {
        console.log(`   ❌ ${opt.table}.${opt.policy}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resultado das otimizações auth.uid():`);
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);

    // 2. Consolidar políticas duplicadas
    console.log(`\n🔧 2. Consolidando políticas duplicadas:`);
    
    // Remover políticas duplicadas na tabela User (manter apenas users_own_record)
    try {
      await prisma.$executeRaw`DROP POLICY IF EXISTS "users_select_own" ON "User"`;
      await prisma.$executeRaw`DROP POLICY IF EXISTS "users_update_own" ON "User"`;
      console.log('   ✅ User: Removidas policies duplicadas (select_own, update_own)');
    } catch (error: any) {
      console.log(`   ❌ User: ${error.message}`);
    }

    // Verificar se Activity tem políticas duplicadas reais
    const activityPolicies = await prisma.$queryRaw`
      SELECT policyname FROM pg_policies 
      WHERE tablename = 'Activity' AND schemaname = 'public'
    ` as Array<{policyname: string}>;
    
    if (activityPolicies.length > 1) {
      console.log(`   ℹ️ Activity: ${activityPolicies.length} políticas mantidas (admin + user access)`);
    }

    console.log('\n🧪 3. Validando otimizações:');
    
    // Contar políticas finais
    const finalPolicies = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = 'public'
    ` as Array<{count: bigint}>;
    
    console.log(`   📋 Total de políticas RLS: ${finalPolicies[0].count}`);
    
    // Verificar se ainda há auth.uid() não otimizado
    const remainingAuthUid = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_policies 
      WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%'
    ` as Array<{count: bigint}>;
    
    if (remainingAuthUid[0].count > 0) {
      console.log(`   ⚠️ auth.uid() não otimizados restantes: ${remainingAuthUid[0].count}`);
    } else {
      console.log('   ✅ Todas as chamadas auth.uid() foram otimizadas!');
    }

  } catch (error) {
    console.error('❌ Erro na otimização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeRLSPerformance();