import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Corrigindo senhas dos usuários...');
    
    // Gerar hash para a senha do admin
    const adminPassword = 'admin123';
    const adminHash = await hashPassword(adminPassword);
    console.log(`Hash gerado para admin: ${adminHash}`);
    
    // Atualizar senha do admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });
    
    if (admin) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: adminHash },
      });
      console.log('Senha do admin atualizada com sucesso!');
    } else {
      console.log('Usuário admin não encontrado!');
    }
    
    // Gerar hash para a senha do usuário
    const userPassword = 'user123';
    const userHash = await hashPassword(userPassword);
    console.log(`Hash gerado para usuário: ${userHash}`);
    
    // Atualizar senha do usuário
    const user = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
    });
    
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: userHash },
      });
      console.log('Senha do usuário atualizada com sucesso!');
    } else {
      console.log('Usuário regular não encontrado!');
    }
    
    console.log('\nCorreção concluída com sucesso!');
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
