#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function applyRLS() {
  try {
    console.log('🛡️ Aplicando Row Level Security (RLS) policies...\n');

    // Ler o arquivo SQL
    const sqlPath = join(__dirname, 'enable-rls.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        // Remove comentários e linhas vazias
        const cleanCmd = cmd.replace(/--.*$/gm, '').trim();
        return cleanCmd.length > 0 && 
               !cleanCmd.startsWith('--') && 
               cleanCmd !== '' &&
               !cleanCmd.match(/^\/\*[\s\S]*?\*\/$/);
      });

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`[${i + 1}/${commands.length}] Executando comando...`);
        
        // Mostrar apenas o primeiro comando ou identificador
        const preview = command.substring(0, 60).replace(/\n/g, ' ') + 
                       (command.length > 60 ? '...' : '');
        console.log(`   ${preview}`);
        
        await prisma.$executeRawUnsafe(command);
        console.log(`   ✅ Sucesso\n`);
        successCount++;
        
      } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}\n`);
        
        // Alguns erros são esperados (como policies já existentes)
        if (error.message.includes('already exists') || 
            error.message.includes('já existe')) {
          console.log(`   ℹ️  Ignorando erro esperado (recurso já existe)\n`);
        } else {
          errorCount++;
        }
      }
    }

    console.log('📊 Resumo da aplicação:');
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📋 Total: ${commands.length}\n`);

    if (errorCount === 0) {
      console.log('🎉 Todas as políticas RLS foram aplicadas com sucesso!');
    } else {
      console.log('⚠️  Algumas políticas falharam. Verifique os erros acima.');
    }

  } catch (error) {
    console.error('❌ Erro fatal ao aplicar RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLS();