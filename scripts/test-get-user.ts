import { getUserByEmail } from '../src/lib/auth';

async function main() {
  try {
    console.log('Testando função getUserByEmail...');
    
    // Testar com o email do admin
    const adminEmail = 'admin@example.com';
    console.log(`Buscando usuário com email: ${adminEmail}`);
    const admin = await getUserByEmail(adminEmail);
    
    if (admin) {
      console.log('Usuário admin encontrado:');
      console.log(`ID: ${admin.id}`);
      console.log(`Nome: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Função: ${admin.role}`);
      console.log(`Senha (hash): ${admin.password ? admin.password.substring(0, 20) + '...' : 'Não definida'}`);
    } else {
      console.log('Usuário admin não encontrado!');
    }
    
    // Testar com o email do usuário regular
    const userEmail = 'user@example.com';
    console.log(`\nBuscando usuário com email: ${userEmail}`);
    const user = await getUserByEmail(userEmail);
    
    if (user) {
      console.log('Usuário regular encontrado:');
      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Função: ${user.role}`);
      console.log(`Senha (hash): ${user.password ? user.password.substring(0, 20) + '...' : 'Não definida'}`);
    } else {
      console.log('Usuário regular não encontrado!');
    }
    
    // Testar com um email inexistente
    const nonExistentEmail = 'nonexistent@example.com';
    console.log(`\nBuscando usuário com email: ${nonExistentEmail}`);
    const nonExistentUser = await getUserByEmail(nonExistentEmail);
    
    if (nonExistentUser) {
      console.log('Usuário inexistente encontrado (isso não deveria acontecer):');
      console.log(nonExistentUser);
    } else {
      console.log('Usuário inexistente não encontrado (comportamento esperado).');
    }
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

main()
  .catch((e) => {
    console.error('Erro durante a execução:', e);
    process.exit(1);
  });
