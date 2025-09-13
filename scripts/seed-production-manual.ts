#!/usr/bin/env tsx
/**
 * Script para executar seed manual na produção
 * Uso: npx tsx scripts/seed-production-manual.ts
 * Ou: DATABASE_URL="..." npx tsx scripts/seed-production-manual.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🚀 Iniciando seed manual para produção...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }

  try {
    // Testar conexão com o banco
    console.log('🔌 Testando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');

    // Verificar usuários existentes
    console.log('🔍 Verificando usuários existentes...');
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
    });

    console.log('Admin exists:', !!existingAdmin);
    console.log('User exists:', !!existingUser);

    let createdCount = 0;

    // Criar admin se não existir
    if (!existingAdmin) {
      console.log('👤 Criando usuário admin...');
      const adminPassword = await hashPassword('admin123');
      
      const admin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@example.com',
          password: adminPassword,
          role: 'admin',
          emailVerified: new Date(),
          isActive: true,
        },
      });
      
      console.log('✅ Admin criado:', admin.id);
      createdCount++;
    } else {
      console.log('ℹ️ Admin já existe:', existingAdmin.id);
    }

    // Criar usuário regular se não existir
    if (!existingUser) {
      console.log('👤 Criando usuário regular...');
      const userPassword = await hashPassword('user123');
      
      const user = await prisma.user.create({
        data: {
          name: 'Usuário',
          email: 'user@example.com',
          password: userPassword,
          role: 'user',
          emailVerified: new Date(),
          isActive: true,
        },
      });
      
      console.log('✅ Usuário criado:', user.id);
      createdCount++;
    } else {
      console.log('ℹ️ Usuário já existe:', existingUser.id);
    }

    // Verificação final
    console.log('🔍 Verificação final...');
    const finalAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: { id: true, email: true, role: true, password: true }
    });

    const finalUser = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      select: { id: true, email: true, role: true, password: true }
    });

    console.log('Final verification:');
    console.log('- Admin exists:', !!finalAdmin, 'Has password:', !!finalAdmin?.password);
    console.log('- User exists:', !!finalUser, 'Has password:', !!finalUser?.password);

    console.log(`\n🎉 Seed concluído com sucesso!`);
    console.log(`📊 Usuários criados: ${createdCount}`);
    console.log(`\n📋 Credenciais de teste:`);
    console.log(`Admin: admin@example.com / admin123`);
    console.log(`Usuário: user@example.com / user123`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco fechada');
  }
}

// Executar seed
seedProduction()
  .catch((error) => {
    console.error('❌ Falha na execução:', error);
    process.exit(1);
  });