import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testando autenticação...');

    // Buscar usuário admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    console.log('Usuário admin encontrado:', !!admin);
    
    if (admin) {
      console.log('ID:', admin.id);
      console.log('Nome:', admin.name);
      console.log('Email:', admin.email);
      console.log('Função:', admin.role);
      console.log('Senha hash armazenada:', admin.password);
      
      // Testar senha
      const testPassword = 'admin123';
      const hashedTestPassword = await hashPassword(testPassword);
      console.log('Hash da senha de teste:', hashedTestPassword);
      
      const isPasswordValid = await verifyPassword(testPassword, admin.password || '');
      console.log('Senha válida:', isPasswordValid);
      
      // Se a senha não for válida, vamos atualizar para garantir
      if (!isPasswordValid) {
        console.log('Atualizando senha do admin...');
        const newPasswordHash = await hashPassword('admin123');
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: newPasswordHash },
        });
        console.log('Senha atualizada com sucesso!');
        console.log('Novo hash:', newPasswordHash);
      }
    } else {
      console.log('Criando usuário admin...');
      const adminPassword = await hashPassword('admin123');
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@example.com',
          password: adminPassword,
          role: 'admin',
        },
      });
      console.log('Usuário admin criado com sucesso!');
      console.log('ID:', newAdmin.id);
      console.log('Hash da senha:', adminPassword);
    }
    
    console.log('Teste concluído!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

main()
  .catch((e) => {
    console.error('Erro durante o teste:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
