import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando conexão com o banco de dados...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Tentar contar os usuários
    const userCount = await prisma.user.count();
    console.log(`Número de usuários no banco de dados: ${userCount}`);
    
    // Listar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });
    
    console.log('Usuários encontrados:');
    users.forEach((user, index) => {
      console.log(`\nUsuário ${index + 1}:`);
      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Função: ${user.role}`);
      console.log(`Senha (hash): ${user.password ? user.password.substring(0, 20) + '...' : 'Não definida'}`);
    });
    
    console.log('\nVerificação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar o banco de dados:', error);
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
