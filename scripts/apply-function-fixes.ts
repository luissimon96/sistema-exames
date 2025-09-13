#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function fixFunctionSecurity() {
  try {
    console.log('🔧 Aplicando correções de segurança nas funções...\n');
    
    const sqlPath = join(__dirname, 'fix-function-security.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    // Split commands properly
    const commands = sql
      .split(/;\s*$\s*/gm)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos...\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (!cmd) continue;
      
      try {
        console.log(`[${i+1}/${commands.length}] Executando função...`);
        const preview = cmd.substring(0, 50).replace(/\n/g, ' ') + '...';
        console.log(`   ${preview}`);
        
        await prisma.$executeRawUnsafe(cmd);
        console.log('   ✅ Sucesso\n');
      } catch (e: any) {
        console.log(`   ❌ Erro: ${e.message}\n`);
      }
    }
    
    console.log('🔍 Verificando configurações de segurança das funções...');
    const result = await prisma.$queryRaw`SELECT * FROM public.check_function_security()` as Array<{
      function_name: string;
      has_fixed_search_path: boolean;
      security_definer: boolean;
      search_path_setting: string;
    }>;
    
    console.log('\n📊 Status de Segurança das Funções:');
    result.forEach(func => {
      const status = func.has_fixed_search_path ? '✅ SEGURO' : '❌ VULNERÁVEL';
      console.log(`   ${func.function_name.padEnd(20)} | Search Path: ${func.search_path_setting.padEnd(15)} | ${status}`);
    });
    
    const secureCount = result.filter(f => f.has_fixed_search_path).length;
    console.log(`\n🎯 Resumo: ${secureCount}/${result.length} funções estão seguras`);
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correções:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFunctionSecurity();