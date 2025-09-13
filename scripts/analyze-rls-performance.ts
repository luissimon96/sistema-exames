#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeRLSPerformance() {
  try {
    console.log('🔍 Analisando Performance das Políticas RLS\n');

    // 1. Listar todas as políticas atuais
    console.log('📋 1. Políticas RLS Atuais:');
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    ` as Array<{
      tablename: string;
      policyname: string;
      permissive: string;
      cmd: string;
      qual: string;
    }>;

    // Agrupar por tabela
    const byTable = policies.reduce((acc, policy) => {
      const table = policy.tablename;
      if (!acc[table]) acc[table] = [];
      acc[table].push(policy);
      return acc;
    }, {} as Record<string, typeof policies>);

    Object.entries(byTable).forEach(([table, tablePolicies]) => {
      console.log(`\n🛡️ ${table}:`);
      tablePolicies.forEach(policy => {
        const hasAuthUid = policy.qual?.includes('auth.uid()');
        const marker = hasAuthUid ? '⚠️' : '✅';
        console.log(`   ${marker} ${policy.policyname} (${policy.cmd})`);
        if (hasAuthUid) {
          console.log(`      🐌 Contém auth.uid() não otimizado`);
        }
      });
    });

    console.log('\n📊 2. Análise de Problemas:');
    
    // 2. Identificar políticas com auth.uid() direto
    const authUidPolicies = policies.filter(p => p.qual?.includes('auth.uid()'));
    console.log(`   ⚠️ Políticas com auth.uid() direto: ${authUidPolicies.length}`);
    
    // 3. Identificar políticas duplicadas por tabela
    Object.entries(byTable).forEach(([table, tablePolicies]) => {
      const duplicates = tablePolicies.filter(p => p.permissive === 'PERMISSIVE').length;
      if (duplicates > 1) {
        console.log(`   ⚠️ ${table}: ${duplicates} políticas permissivas (duplicação possível)`);
      }
    });

    console.log('\n🔧 3. Otimizações Recomendadas:');
    
    // Recomendar otimizações
    if (authUidPolicies.length > 0) {
      console.log(`   📝 Substituir ${authUidPolicies.length} calls de auth.uid() por (select auth.uid())`);
    }
    
    const duplicatedTables = Object.entries(byTable)
      .filter(([_, policies]) => policies.filter(p => p.permissive === 'PERMISSIVE').length > 1)
      .map(([table]) => table);
    
    if (duplicatedTables.length > 0) {
      console.log(`   📝 Consolidar políticas duplicadas em: ${duplicatedTables.join(', ')}`);
    }

    console.log('\n💡 4. SQL de Otimização:');
    
    // Gerar SQL de correção para auth.uid()
    authUidPolicies.forEach(policy => {
      const optimizedQual = policy.qual?.replace(/auth\.uid\(\)/g, '(select auth.uid())');
      console.log(`\n-- Otimizar política ${policy.policyname} na tabela ${policy.tablename}`);
      console.log(`DROP POLICY IF EXISTS "${policy.policyname}" ON "${policy.tablename}";`);
      console.log(`CREATE POLICY "${policy.policyname}" ON "${policy.tablename}" FOR ${policy.cmd} USING (${optimizedQual});`);
    });

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRLSPerformance();