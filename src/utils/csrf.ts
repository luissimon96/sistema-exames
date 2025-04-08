import CryptoJS from 'crypto-js';

// Chave para tokens CSRF - em produção, isso deve vir de variáveis de ambiente
const CSRF_SECRET = process.env.CSRF_SECRET || 'uma-chave-csrf-muito-segura-que-deve-ser-substituida';

/**
 * Gera um token CSRF
 * @returns Token CSRF
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2, 15);
  const data = `${timestamp}:${randomString}`;
  
  // Criar um hash HMAC do timestamp e string aleatória
  const hmac = CryptoJS.HmacSHA256(data, CSRF_SECRET);
  const token = `${data}:${hmac}`;
  
  // Codificar em base64 para uso em formulários
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(token));
}

/**
 * Verifica se um token CSRF é válido
 * @param token Token CSRF a ser verificado
 * @param maxAge Idade máxima do token em milissegundos (padrão: 1 hora)
 * @returns Verdadeiro se o token for válido, falso caso contrário
 */
export function validateCsrfToken(token: string, maxAge: number = 3600000): boolean {
  try {
    // Decodificar o token
    const decodedToken = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(token));
    const [timestamp, randomString, receivedHmac] = decodedToken.split(':');
    
    if (!timestamp || !randomString || !receivedHmac) {
      return false;
    }
    
    // Verificar se o token não expirou
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    if (isNaN(tokenTime) || now - tokenTime > maxAge) {
      return false;
    }
    
    // Recalcular o HMAC para verificar a integridade
    const data = `${timestamp}:${randomString}`;
    const expectedHmac = CryptoJS.HmacSHA256(data, CSRF_SECRET).toString();
    
    // Comparar os HMACs
    return expectedHmac === receivedHmac;
  } catch (error) {
    console.error('Erro ao validar token CSRF:', error);
    return false;
  }
}
