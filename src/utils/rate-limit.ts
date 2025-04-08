import { NextRequest, NextResponse } from 'next/server';

// Armazenamento em memória para limites de taxa
// Em produção, isso deveria usar Redis ou outro armazenamento distribuído
interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Middleware para limitar a taxa de requisições
 * @param request Requisição Next.js
 * @param maxRequests Número máximo de requisições permitidas
 * @param windowMs Janela de tempo em milissegundos
 * @returns NextResponse ou undefined se a requisição for permitida
 */
export function rateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): NextResponse | undefined {
  // Obter o IP do cliente
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  // Limpar entradas expiradas
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
  
  // Inicializar ou obter o registro para este IP
  if (!store[ip]) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  // Se o tempo de reset já passou, reiniciar o contador
  if (store[ip].resetTime < now) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  // Incrementar o contador
  store[ip].count += 1;
  
  // Verificar se excedeu o limite
  if (store[ip].count > maxRequests) {
    // Calcular o tempo restante até o reset
    const resetInSeconds = Math.ceil((store[ip].resetTime - now) / 1000);
    
    // Retornar resposta 429 (Too Many Requests)
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Muitas requisições',
        message: `Limite de taxa excedido. Tente novamente em ${resetInSeconds} segundos.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(resetInSeconds),
        },
      }
    );
  }
  
  // Se não excedeu o limite, retornar undefined para permitir a requisição
  return undefined;
}
