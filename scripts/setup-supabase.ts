import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Configurando banco de dados no Supabase...');

    // Verificar a conexão com o banco de dados
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Conexão com o banco de dados estabelecida com sucesso!');
    } catch (error) {
      console.error('Erro ao conectar ao banco de dados:', error);
      return;
    }

    // Criar usuários padrão
    console.log('Criando usuários padrão...');
    
    // Verificar se o usuário admin existe
    const adminEmail = 'admin@example.com';
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      console.log('Criando usuário admin...');
      const adminPassword = await hashPassword('admin123');
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isActive: true,
        },
      });
      console.log('Usuário admin criado com sucesso!');
    } else {
      console.log('Usuário admin já existe.');
    }

    // Verificar se o usuário regular existe
    const userEmail = 'user@example.com';
    const regularUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!regularUser) {
      console.log('Criando usuário regular...');
      const userPassword = await hashPassword('user123');
      await prisma.user.create({
        data: {
          name: 'Usuário',
          email: userEmail,
          password: userPassword,
          role: 'user',
          isActive: true,
        },
      });
      console.log('Usuário regular criado com sucesso!');
    } else {
      console.log('Usuário regular já existe.');
    }

    console.log('Configuração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a configuração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Erro durante a execução:', e);
    process.exit(1);
  });
