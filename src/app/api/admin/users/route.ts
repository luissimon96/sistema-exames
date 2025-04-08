import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

// Número de usuários por página
const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e autorização
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
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { role: true },
    });
    
    if (!user || user.role !== 'admin') {
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
    
    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    
    // Construir filtro de busca
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};
    
    // Contar total de usuários
    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
    
    // Buscar usuários com paginação
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        users,
        totalUsers,
        totalPages,
        currentPage: page,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao buscar usuários',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
