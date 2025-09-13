#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function applyOptimizations() {
  try {
    console.log('🚀 Aplicando Otimizações Finais RLS\n');

    // Ler o arquivo SQL de otimização
    const sqlContent = readFileSync('./scripts/final-rls-optimization.sql', 'utf-8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    console.log(`📋 Executando ${commands.length} comandos SQL:\n`);

    for (const command of commands) {
      try {
        await prisma.$executeRawUnsafe(command + ';');
        
        // Extrair nome da política do comando para feedback
        const policyMatch = command.match(/CREATE POLICY "([^"]+)" ON "([^"]+)"/);
        if (policyMatch) {
          const [, policyName, tableName] = policyMatch;
          console.log(`✅ ${tableName}.${policyName}`);
        } else if (command.includes('DROP POLICY')) {
          const dropMatch = command.match(/DROP POLICY IF EXISTS "([^"]+)" ON "([^"]+)"/);
          if (dropMatch) {
            const [, policyName, tableName] = dropMatch;
            console.log(`🗑️ ${tableName}.${policyName} (removida)`);
          }
        }
        
        successCount++;
        
      } catch (error: any) {
        console.log(`❌ Erro no comando: ${error.message}`);
        console.log(`   SQL: ${command.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);

    // Validação final
    console.log('\n🔍 Validação Final:');
    
    const optimizedCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_policies 
      WHERE schemaname = 'public' 
      AND qual LIKE '%(select auth.uid())%'
    ` as Array<{count: bigint}>;

    const unoptimizedCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_policies 
      WHERE schemaname = 'public' 
      AND qual LIKE '%auth.uid()%'
      AND qual NOT LIKE '%(select auth.uid())%'
    ` as Array<{count: bigint}>;

    const totalRLSPolicies = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_policies 
      WHERE schemaname = 'public'
    ` as Array<{count: bigint}>;

    console.log(`📋 Total de políticas RLS: ${totalRLSPolicies[0].count}`);
    console.log(`✅ Políticas otimizadas: ${optimizedCount[0].count}`);
    console.log(`⚠️ Políticas não otimizadas: ${unoptimizedCount[0].count}`);

    const performanceScore = Number(optimizedCount[0].count) / (Number(optimizedCount[0].count) + Number(unoptimizedCount[0].count)) * 100;

    console.log('\n🎯 Score de Performance:');
    if (performanceScore >= 90) {
      console.log(`🎉 EXCELENTE: ${performanceScore.toFixed(0)}%`);
    } else if (performanceScore >= 70) {
      console.log(`✅ BOM: ${performanceScore.toFixed(0)}%`);
    } else {
      console.log(`⚠️ REQUER ATENÇÃO: ${performanceScore.toFixed(0)}%`);
    }

  } catch (error) {
    console.error('❌ Erro na aplicação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyOptimizations();