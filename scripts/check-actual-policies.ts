#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkActualPolicies() {
  try {
    console.log('🔍 Verificando Políticas Reais\n');

    // Buscar todas as políticas com detalhes
    const policies = await prisma.$queryRaw`
      SELECT tablename, policyname, qual, cmd
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    ` as Array<{tablename: string, policyname: string, qual: string, cmd: string}>;

    console.log('📋 Políticas Atuais:');
    
    for (const policy of policies) {
      const hasSelectAuthUid = policy.qual?.includes('(select auth.uid())');
      const hasAuthUid = policy.qual?.includes('auth.uid()');
      
      let status = '✅';
      let description = 'OK';
      
      if (hasAuthUid && !hasSelectAuthUid) {
        status = '⚠️';
        description = 'auth.uid() não otimizado';
      } else if (hasSelectAuthUid) {
        status = '🚀'; 
        description = 'OTIMIZADO com (select auth.uid())';
      }
      
      console.log(`${status} ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      console.log(`   ${description}`);
      
      // Mostrar snippet da condição para debug
      if (policy.qual) {
        const snippet = policy.qual.substring(0, 80) + (policy.qual.length > 80 ? '...' : '');
        console.log(`   Condição: ${snippet}`);
      }
      console.log('');
    }

    // Estatísticas
    const totalPolicies = policies.length;
    const optimizedPolicies = policies.filter(p => p.qual?.includes('(select auth.uid())')).length;
    const unoptimizedPolicies = policies.filter(p => p.qual?.includes('auth.uid()') && !p.qual?.includes('(select auth.uid())')).length;
    
    console.log('📊 Estatísticas:');
    console.log(`   📋 Total de políticas: ${totalPolicies}`);
    console.log(`   🚀 Otimizadas: ${optimizedPolicies}`);
    console.log(`   ⚠️ Não otimizadas: ${unoptimizedPolicies}`);
    console.log(`   ✅ Outras: ${totalPolicies - optimizedPolicies - unoptimizedPolicies}`);

    if (optimizedPolicies > 0) {
      console.log('\n🎉 Alguma otimização foi aplicada!');
    } else if (unoptimizedPolicies > 0) {
      console.log('\n⚠️ Ainda há políticas que precisam ser otimizadas');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualPolicies();