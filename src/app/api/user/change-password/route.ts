import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para alterar sua senha',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter dados do corpo da requisição
    const { currentPassword, newPassword } = await request.json();

    // Validar dados
    if (!currentPassword || !newPassword) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dados incompletos',
          message: 'Senha atual e nova senha são obrigatórias',
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

    if (!user || !user.password) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Usuário não encontrado',
          message: 'Usuário não encontrado ou não possui senha definida',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar senha atual
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Senha incorreta',
          message: 'A senha atual está incorreta',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Senha alterada com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao alterar senha',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
