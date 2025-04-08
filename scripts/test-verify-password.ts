import { hashPassword, verifyPassword } from '../src/lib/auth';

async function main() {
  try {
    console.log('Testando funções de senha...');

    // Testar hashPassword
    const password = 'admin123';
    console.log(`Gerando hash para senha: ${password}`);
    const hashedPassword = await hashPassword(password);
    console.log(`Hash gerado: ${hashedPassword}`);

    // Testar verifyPassword com senha correta
    console.log(`\nVerificando senha correta: ${password}`);
    const isCorrectPasswordValid = await verifyPassword(password, hashedPassword);
    console.log(`Senha correta é válida: ${isCorrectPasswordValid}`);

    // Testar verifyPassword com senha incorreta
    const wrongPassword = 'wrongpassword';
    console.log(`\nVerificando senha incorreta: ${wrongPassword}`);
    const isWrongPasswordValid = await verifyPassword(wrongPassword, hashedPassword);
    console.log(`Senha incorreta é válida: ${isWrongPasswordValid}`);

    // Testar com as senhas dos usuários do banco de dados
    console.log('\nTestando senhas dos usuários do banco de dados:');

    // Hash conhecido do admin (do script anterior)
    const adminHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // admin123
    console.log(`\nVerificando senha do admin: admin123`);
    const isAdminPasswordValid = await verifyPassword('admin123', adminHash);
    console.log(`Senha do admin é válida: ${isAdminPasswordValid}`);

    // Hash conhecido do usuário (do script anterior)
    const userHash = 'e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446'; // user123
    console.log(`\nVerificando senha do usuário: user123`);
    const isUserPasswordValid = await verifyPassword('user123', userHash);
    console.log(`Senha do usuário é válida: ${isUserPasswordValid}`);

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
