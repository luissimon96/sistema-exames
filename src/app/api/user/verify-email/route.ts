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
          message: 'Você precisa estar autenticado para verificar seu email',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter código de verificação
    const { code } = await request.json();

    if (!code) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Código não fornecido',
          message: 'O código de verificação é obrigatório',
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

    // Verificar se o email já está verificado
    if (user.emailVerified) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Email já verificado',
          message: 'Seu email já está verificado',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar código
    if (
      !user.resetToken || 
      user.resetToken !== code || 
      !user.resetTokenExpiry || 
      user.resetTokenExpiry < new Date()
    ) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Código inválido',
          message: 'O código de verificação é inválido ou expirou',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Atualizar usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'verify_email',
        details: 'Email verificado com sucesso',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Email verificado com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao verificar email:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao verificar email',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
