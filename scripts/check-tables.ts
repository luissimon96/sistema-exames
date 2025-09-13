#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas no banco de dados...\n');

    // Query para listar todas as tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    ` as Array<{table_name: string, table_schema: string}>;

    console.log(`📊 Total de tabelas encontradas: ${tables.length}\n`);

    for (const table of tables) {
      console.log(`📋 Tabela: ${table.table_name}`);
      
      // Verificar se RLS está ativado
      const rlsStatus = await prisma.$queryRaw`
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = ${table.table_name} AND c.relkind = 'r';
      ` as Array<{relname: string, relrowsecurity: boolean, relforcerowsecurity: boolean}>;

      if (rlsStatus.length > 0) {
        const rls = rlsStatus[0];
        console.log(`   🛡️ RLS ativado: ${rls.relrowsecurity ? '✅ SIM' : '❌ NÃO'}`);
        if (rls.relrowsecurity) {
          console.log(`   🔒 RLS forçado: ${rls.relforcerowsecurity ? '✅ SIM' : '❌ NÃO'}`);
        }
      }

      // Contar registros
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        console.log(`   📈 Registros: ${(count as any)[0].count}`);
      } catch (e) {
        console.log(`   📈 Registros: Erro ao contar`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();