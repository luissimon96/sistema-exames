// Chave para tokens CSRF - DEVE vir de variáveis de ambiente
const CSRF_SECRET = process.env.CSRF_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CSRF_SECRET environment variable is required in production');
  }
  console.warn('WARNING: Using default CSRF_SECRET in development. Set CSRF_SECRET environment variable.');
  return 'development-only-csrf-key-not-for-production';
})();

// Helper para converter string para Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper para gerar bytes aleatórios usando Web Crypto API
async function getRandomBytes(length: number): Promise<Uint8Array> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

// Helper para criar HMAC usando Web Crypto API
async function createHmacWeb(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, stringToUint8Array(data));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper para comparação segura de strings
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Gera um token CSRF
 * @returns Promise com Token CSRF
 */
export async function generateCsrfToken(): Promise<string> {
  const timestamp = Date.now().toString();
  // Usar Web Crypto API para segurança criptográfica
  const randomBytesArray = await getRandomBytes(16);
  const randomHex = Array.from(randomBytesArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const data = `${timestamp}:${randomHex}`;
  
  // Criar um hash HMAC do timestamp e bytes aleatórios
  const hmac = await createHmacWeb(data, CSRF_SECRET);
  const token = `${data}:${hmac}`;
  
  // Codificar em base64 para uso em formulários
  return btoa(token);
}

/**
 * Verifica se um token CSRF é válido
 * @param token Token CSRF a ser verificado
 * @param maxAge Idade máxima do token em milissegundos (padrão: 1 hora)
 * @returns Promise com verdadeiro se o token for válido, falso caso contrário
 */
export async function validateCsrfToken(token: string, maxAge: number = 3600000): Promise<boolean> {
  try {
    // Decodificar o token
    const decodedToken = atob(token);
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
    const expectedHmac = await createHmacWeb(data, CSRF_SECRET);
    
    // Usar timingSafeEqual para evitar timing attacks
    return timingSafeEqual(expectedHmac, receivedHmac);
  } catch (error) {
    // Não logar detalhes do erro por segurança
    if (process.env.NODE_ENV === 'development') {
      console.error('CSRF token validation error:', (error as Error).message);
    }
    return false;
  }
}
