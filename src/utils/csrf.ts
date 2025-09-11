import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

// Chave para tokens CSRF - DEVE vir de variáveis de ambiente
const CSRF_SECRET = process.env.CSRF_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CSRF_SECRET environment variable is required in production');
  }
  console.warn('WARNING: Using default CSRF_SECRET in development. Set CSRF_SECRET environment variable.');
  return 'development-only-csrf-key-not-for-production';
})();

/**
 * Gera um token CSRF
 * @returns Token CSRF
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString();
  // Usar randomBytes para segurança criptográfica
  const randomBytes32 = randomBytes(16).toString('hex');
  const data = `${timestamp}:${randomBytes32}`;
  
  // Criar um hash HMAC do timestamp e bytes aleatórios
  const hmac = createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex');
  const token = `${data}:${hmac}`;
  
  // Codificar em base64 para uso em formulários
  return Buffer.from(token).toString('base64');
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
    const decodedToken = Buffer.from(token, 'base64').toString('utf8');
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
    const expectedHmac = createHmac('sha256', CSRF_SECRET)
      .update(data)
      .digest('hex');
    
    // Usar timingSafeEqual para evitar timing attacks
    const expectedBuffer = Buffer.from(expectedHmac, 'hex');
    const receivedBuffer = Buffer.from(receivedHmac, 'hex');
    
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    // Não logar detalhes do erro por segurança
    if (process.env.NODE_ENV === 'development') {
      console.error('CSRF token validation error:', (error as Error).message);
    }
    return false;
  }
}
