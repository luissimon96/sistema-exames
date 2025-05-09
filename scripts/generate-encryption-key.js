// Script para gerar uma chave de criptografia para dados sensíveis
const crypto = require('crypto');

// Gerar uma string aleatória de 32 bytes e convertê-la para base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('Chave secreta gerada para ENCRYPTION_KEY:');
console.log(secret);
console.log('\nAdicione esta chave ao seu arquivo .env.local na variável ENCRYPTION_KEY.');
console.log('Esta chave será usada para criptografar dados sensíveis na aplicação.');
