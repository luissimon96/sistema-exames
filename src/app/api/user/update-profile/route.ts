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
          message: 'Você precisa estar autenticado para atualizar seu perfil',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter dados do corpo da requisição
    const {
      name,
      bio,
      location,
      website,
      phoneNumber,
      jobTitle,
      company
    } = await request.json();

    // Validar dados
    if (!name) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dados incompletos',
          message: 'Nome é obrigatório',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Atualizar perfil do usuário
    const updatedUser = await prisma.user.update({
      where: { email: token.email },
      data: {
        name,
        bio,
        location,
        website,
        phoneNumber,
        jobTitle,
        company,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        location: true,
        website: true,
        phoneNumber: true,
        jobTitle: true,
        company: true,
        image: true,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Perfil atualizado com sucesso',
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao atualizar perfil',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
