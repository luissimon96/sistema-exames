import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

// Número de logs por página
const PAGE_SIZE = 20;

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
    const action = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    // Construir filtro de busca
    const where: Record<string, unknown> & {
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
    } = {};
    
    // Filtro de busca por texto
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
            },
          },
        },
        {
          details: {
            contains: search,
          },
        },
      ];
    }
    
    // Filtro por ação
    if (action) {
      where.action = action;
    }
    
    // Filtro por data
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        // Adicionar um dia para incluir todo o dia final
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        where.createdAt.lt = endDateObj;
      }
    }
    
    // Contar total de logs
    const totalLogs = await prisma.activity.count({ where });
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);
    
    // Buscar logs com paginação
    const logs = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    
    // Formatar logs para resposta
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user.name || 'Usuário sem nome',
      userEmail: log.user.email,
      action: log.action,
      details: log.details || '',
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
      createdAt: log.createdAt.toISOString(),
    }));
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        logs: formattedLogs,
        totalLogs,
        totalPages,
        currentPage: page,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar logs de atividade:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao buscar logs de atividade',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
