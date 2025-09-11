import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetToken } from '@/lib/auth';
import { rateLimit } from '@/utils/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Aplicar rate limiting - 10 verificações por minuto
    const rateLimitResponse = rateLimit(request, 10, 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Obter token da URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Token não fornecido',
          message: 'Token de redefinição de senha não fornecido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o token é válido
    const user = await verifyPasswordResetToken(token);
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Token inválido',
          message: 'Token de redefinição de senha inválido ou expirado',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Token válido',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao verificar token de redefinição de senha:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao verificar token',
        message: 'Ocorreu um erro ao verificar o token de redefinição de senha',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
