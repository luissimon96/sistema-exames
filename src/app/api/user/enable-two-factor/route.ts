import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para ativar a autenticação de dois fatores',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter dados do corpo da requisição
    const { secret, code } = await request.json();

    // Validar dados
    if (!secret || !code) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dados incompletos',
          message: 'Segredo e código são obrigatórios',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar código
    const isValidCode = authenticator.verify({ token: code, secret });
    
    if (!isValidCode) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Código inválido',
          message: 'O código de verificação é inválido',
        }),
        {
          status: 400,
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

    // Ativar 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Autenticação de dois fatores ativada com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao ativar 2FA:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao ativar autenticação de dois fatores',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
