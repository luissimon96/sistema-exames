#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSingleOptimization() {
  try {
    console.log('🧪 Testando Uma Única Otimização\n');

    // Testar na tabela Account
    console.log('📋 Política ANTES:');
    const beforePolicy = await prisma.$queryRaw`
      SELECT qual FROM pg_policies 
      WHERE tablename = 'Account' AND policyname = 'accounts_own_record'
    ` as Array<{qual: string}>;
    
    console.log(`   ${beforePolicy[0]?.qual || 'Não encontrada'}\n`);

    // Aplicar otimização com subquery correta
    console.log('🔧 Aplicando otimização...');
    
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "accounts_own_record" ON "Account"`);
    
    // Usar uma subquery real otimizada
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "accounts_own_record" ON "Account" FOR ALL 
      USING ((SELECT auth.uid())::text = "userId")
    `);

    console.log('✅ Otimização aplicada!\n');

    // Verificar política DEPOIS
    console.log('📋 Política DEPOIS:');
    const afterPolicy = await prisma.$queryRaw`
      SELECT qual FROM pg_policies 
      WHERE tablename = 'Account' AND policyname = 'accounts_own_record'
    ` as Array<{qual: string}>;
    
    console.log(`   ${afterPolicy[0]?.qual || 'Não encontrada'}\n`);

    // Testar se ainda contém auth.uid()
    const containsAuthUid = afterPolicy[0]?.qual?.includes('auth.uid()');
    const containsSelectAuthUid = afterPolicy[0]?.qual?.includes('SELECT auth.uid()');
    
    console.log('🔍 Análise:');
    console.log(`   Contém auth.uid(): ${containsAuthUid ? '⚠️ SIM' : '✅ NÃO'}`);
    console.log(`   Contém SELECT auth.uid(): ${containsSelectAuthUid ? '✅ SIM' : '❌ NÃO'}`);
    
    if (containsSelectAuthUid && !containsAuthUid) {
      console.log('\n🎉 SUCESSO! Política otimizada corretamente');
    } else if (containsAuthUid) {
      console.log('\n⚠️ Ainda contém auth.uid() direto - precisa de abordagem diferente');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSingleOptimization();