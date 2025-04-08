import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, verifyPasswordResetToken } from '@/lib/auth';
import { rateLimit } from '@/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting - 5 redefinições por hora
    const rateLimitResponse = rateLimit(request, 5, 60 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Obter dados do corpo da requisição
    const { token, password } = await request.json();

    if (!token || !password) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dados incompletos',
          message: 'Token e nova senha são obrigatórios',
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

    // Redefinir a senha
    const success = await resetPassword(token, password);
    
    if (!success) {
      throw new Error('Erro ao redefinir senha');
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Senha redefinida com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao redefinir senha',
        message: error.message || 'Ocorreu um erro ao redefinir sua senha',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
