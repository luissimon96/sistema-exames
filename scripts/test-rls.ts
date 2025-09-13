#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRLS() {
  try {
    console.log('🧪 Testando políticas RLS...\n');

    // 1. Testar acesso básico às tabelas
    console.log('📋 1. Testando acesso básico às tabelas:');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`   ✅ User: ${userCount} registros acessíveis`);
    } catch (e: any) {
      console.log(`   ❌ User: ${e.message}`);
    }

    try {
      const activityCount = await prisma.activity.count();
      console.log(`   ✅ Activity: ${activityCount} registros acessíveis`);
    } catch (e: any) {
      console.log(`   ❌ Activity: ${e.message}`);
    }

    try {
      const sessionCount = await prisma.session.count();
      console.log(`   ✅ Session: ${sessionCount} registros acessíveis`);
    } catch (e: any) {
      console.log(`   ❌ Session: ${e.message}`);
    }

    console.log('');

    // 2. Testar policies específicas
    console.log('📋 2. Testando policies com auth.uid():');

    // Simular diferentes contextos de usuário
    const testUsers = [
      'cmafz1pyu0000brax8l4was2w', // Usuário real do DB
      'cmfhk74yz0000brsxp6j5c7wp', // Admin do DB
      'fake-user-id' // Usuário inexistente
    ];

    for (const userId of testUsers) {
      console.log(`\n   🔍 Testando como usuário: ${userId.substring(0, 8)}...`);
      
      try {
        // Simular auth.uid() através de configuração de sessão
        await prisma.$executeRaw`SET session auth.uid = ${userId}`;
        
        const userAccess = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM "User" 
          WHERE ${userId}::text = id
        `;
        console.log(`      User access: ${(userAccess as any)[0].count} registros`);

        const activityAccess = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM "Activity" 
          WHERE ${userId}::text = "userId"
        `;
        console.log(`      Activity access: ${(activityAccess as any)[0].count} registros`);

      } catch (e: any) {
        console.log(`      ❌ Erro: ${e.message}`);
      }
    }

    console.log('');

    // 3. Testar política de admin
    console.log('📋 3. Testando políticas de admin:');
    
    try {
      // Verificar se admin pode acessar migration table
      const migrationAccess = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "_prisma_migrations"
      `;
      console.log(`   Migration access: ${(migrationAccess as any)[0].count} registros`);
    } catch (e: any) {
      console.log(`   ❌ Migration access negado: ${e.message}`);
    }

    console.log('');

    // 4. Verificar integridade das policies
    console.log('📋 4. Verificando integridade das policies:');
    
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    ` as Array<any>;

    const policyCount = policies.length;
    const tableCount = [...new Set(policies.map(p => p.tablename))].length;
    
    console.log(`   📊 Total de policies: ${policyCount}`);
    console.log(`   📋 Tabelas com policies: ${tableCount}`);
    
    // Agrupar por tabela
    const byTable = policies.reduce((acc, policy) => {
      const table = policy.tablename;
      if (!acc[table]) acc[table] = [];
      acc[table].push(policy.policyname);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(byTable).forEach(([table, policyNames]) => {
      console.log(`   🛡️ ${table}: ${(policyNames as string[]).length} policies`);
    });

  } catch (error) {
    console.error('❌ Erro ao testar RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRLS();