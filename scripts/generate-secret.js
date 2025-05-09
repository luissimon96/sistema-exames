// Script para gerar uma chave secreta para o NextAuth
const crypto = require('crypto');

// Gerar uma string aleatória de 32 bytes e convertê-la para base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('Chave secreta gerada para NEXTAUTH_SECRET:');
console.log(secret);
console.log('\nAdicione esta chave ao seu arquivo .env.local ou às variáveis de ambiente da Vercel.');
