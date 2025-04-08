import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

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
    const timeRange = searchParams.get('timeRange') || 'month';
    
    // Definir período de tempo
    let startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Buscar estatísticas
    const totalUsers = await prisma.user.count();
    
    const activeUsers = await prisma.user.count({
      where: {
        lastActivity: {
          gte: startDate,
        },
      },
    });
    
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
    
    // Estatísticas de uploads e exames (simuladas)
    const totalUploads = 120;
    const totalExams = 350;
    const averageExamsPerUser = totalUsers > 0 ? totalExams / totalUsers : 0;
    
    // Estatísticas de atividade
    const activityCount = await prisma.activity.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
    
    // Estatísticas por tipo de atividade
    const loginActivities = await prisma.activity.count({
      where: {
        action: 'login',
        createdAt: {
          gte: startDate,
        },
      },
    });
    
    const uploadActivities = await prisma.activity.count({
      where: {
        action: 'upload',
        createdAt: {
          gte: startDate,
        },
      },
    });
    
    const profileUpdateActivities = await prisma.activity.count({
      where: {
        action: 'update_profile',
        createdAt: {
          gte: startDate,
        },
      },
    });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        totalUsers,
        activeUsers,
        newUsers,
        totalUploads,
        totalExams,
        averageExamsPerUser,
        activityCount,
        activityStats: {
          login: loginActivities,
          upload: uploadActivities,
          profileUpdate: profileUpdateActivities,
        },
        timeRange,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao buscar estatísticas',
        message: error.message || 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
