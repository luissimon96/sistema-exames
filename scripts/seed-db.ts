import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!adminExists) {
    const adminPassword = await hashPassword('admin123');
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
      },
    });
    console.log('Usuário admin criado com sucesso!');
  } else {
    console.log('Usuário admin já existe, pulando...');
  }

  // Criar usuário regular
  const userExists = await prisma.user.findUnique({
    where: { email: 'user@example.com' },
  });

  if (!userExists) {
    const userPassword = await hashPassword('user123');
    await prisma.user.create({
      data: {
        name: 'Usuário',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
      },
    });
    console.log('Usuário regular criado com sucesso!');
  } else {
    console.log('Usuário regular já existe, pulando...');
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
