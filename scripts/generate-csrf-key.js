// Script para gerar uma chave secreta para tokens CSRF
const crypto = require('crypto');

// Gerar uma string aleatória de 32 bytes e convertê-la para base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('Chave secreta gerada para CSRF_SECRET:');
console.log(secret);
console.log('\nAdicione esta chave ao seu arquivo .env.local na variável CSRF_SECRET.');
console.log('Esta chave será usada para assinar e verificar tokens CSRF, protegendo sua aplicação contra ataques de falsificação de solicitação entre sites.');
