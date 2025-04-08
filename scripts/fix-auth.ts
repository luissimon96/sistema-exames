import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando correção de autenticação...');

    // Verificar se o banco de dados existe e está acessível
    try {
      const userCount = await prisma.user.count();
      console.log(`Número de usuários no banco de dados: ${userCount}`);
    } catch (error) {
      console.error('Erro ao acessar o banco de dados:', error);
      console.log('Tentando criar o banco de dados...');
    }

    // Verificar se o usuário admin existe
    const adminEmail = 'admin@example.com';
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (admin) {
      console.log('Usuário admin encontrado:', admin.id);
      
      // Atualizar a senha do admin
      const adminPassword = await hashPassword('admin123');
      await prisma.user.update({
        where: { id: admin.id },
        data: { 
          password: adminPassword,
          // Garantir que outros campos estejam corretos
          role: 'admin',
          isActive: true,
        },
      });
      console.log('Senha do admin atualizada com sucesso!');
    } else {
      console.log('Usuário admin não encontrado. Criando...');
      
      // Criar usuário admin
      const adminPassword = await hashPassword('admin123');
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isActive: true,
        },
      });
      console.log('Usuário admin criado com sucesso:', newAdmin.id);
    }

    // Verificar se o usuário regular existe
    const userEmail = 'user@example.com';
    const regularUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (regularUser) {
      console.log('Usuário regular encontrado:', regularUser.id);
      
      // Atualizar a senha do usuário regular
      const userPassword = await hashPassword('user123');
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { 
          password: userPassword,
          // Garantir que outros campos estejam corretos
          role: 'user',
          isActive: true,
        },
      });
      console.log('Senha do usuário regular atualizada com sucesso!');
    } else {
      console.log('Usuário regular não encontrado. Criando...');
      
      // Criar usuário regular
      const userPassword = await hashPassword('user123');
      const newUser = await prisma.user.create({
        data: {
          name: 'Usuário',
          email: userEmail,
          password: userPassword,
          role: 'user',
          isActive: true,
        },
      });
      console.log('Usuário regular criado com sucesso:', newUser.id);
    }

    console.log('Correção de autenticação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a correção:', error);
  }
}

main()
  .catch((e) => {
    console.error('Erro durante a execução:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
