import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para desativar a autenticação de dois fatores',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Usuário não encontrado',
          message: 'Usuário não encontrado',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Desativar 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Autenticação de dois fatores desativada com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao desativar 2FA:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao desativar autenticação de dois fatores',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
