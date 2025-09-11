import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

// Verificar se o usuário é admin
async function isAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  
  return user?.role === 'admin';
}

// Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para acessar esta API',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verificar se o usuário é admin
    if (!(await isAdmin(token.email))) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar esta API',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Obter dados do corpo da requisição
    const { name, role, isActive } = await request.json();
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!userExists) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Usuário não encontrado',
          message: 'O usuário especificado não foi encontrado',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        role,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Usuário atualizado com sucesso',
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao atualizar usuário',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Verificar autenticação
    const token = await getToken({ req: request });
    
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          message: 'Você precisa estar autenticado para acessar esta API',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verificar se o usuário é admin
    if (!(await isAdmin(token.email))) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar esta API',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!userExists) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Usuário não encontrado',
          message: 'O usuário especificado não foi encontrado',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verificar se o usuário está tentando excluir a si mesmo
    if (userExists.email === token.email) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Operação não permitida',
          message: 'Você não pode excluir sua própria conta',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Excluir usuário
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Usuário excluído com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao excluir usuário',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
