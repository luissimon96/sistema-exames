import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
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
    const format = searchParams.get('format') || 'csv';
    const dataType = searchParams.get('dataType') || 'users';
    
    // Obter opções do corpo da requisição
    const options = await request.json();
    
    // Definir período de tempo
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (options.dateRange?.startDate) {
      startDate = new Date(options.dateRange.startDate);
    }
    
    if (options.dateRange?.endDate) {
      endDate = new Date(options.dateRange.endDate);
      // Adicionar um dia para incluir todo o dia final
      endDate.setDate(endDate.getDate() + 1);
    }
    
    // Preparar dados para exportação
    let results: Record<string, unknown>[] = [];
    
    switch (dataType) {
      case 'users':
        // Definir campos a incluir
        const userSelect: Record<string, unknown> = {
          id: true,
          createdAt: true,
          updatedAt: true,
        };
        
        if (options.includeFields?.personalInfo) {
          userSelect.name = true;
          userSelect.email = true;
          userSelect.role = true;
          userSelect.emailVerified = true;
        }
        
        if (options.includeFields?.contactInfo) {
          userSelect.phoneNumber = true;
          userSelect.location = true;
          userSelect.website = true;
          userSelect.company = true;
          userSelect.jobTitle = true;
        }
        
        if (options.includeFields?.activityData) {
          userSelect.lastLogin = true;
          userSelect.loginCount = true;
          userSelect.isActive = true;
          userSelect.lastActivity = true;
        }
        
        // Construir filtro
        const userWhere: Record<string, unknown> & {
          createdAt?: {
            gte?: Date;
            lt?: Date;
          };
        } = {};
        
        if (startDate || endDate) {
          userWhere.createdAt = {};
          
          if (startDate) {
            userWhere.createdAt.gte = startDate;
          }
          
          if (endDate) {
            userWhere.createdAt.lt = endDate;
          }
        }
        
        // Buscar usuários
        const users = await prisma.user.findMany({
          select: userSelect,
          where: userWhere,
          orderBy: { createdAt: 'desc' },
        });
        
        // Formatar dados
        results = users.map((user) => {
          const formattedUser: Record<string, unknown> = {};
          
          // Formatar datas
          if (user.createdAt && user.createdAt instanceof Date) {
            formattedUser.createdAt = user.createdAt.toISOString();
          }
          
          if (user.updatedAt && user.updatedAt instanceof Date) {
            formattedUser.updatedAt = user.updatedAt.toISOString();
          }
          
          if (user.lastLogin && user.lastLogin instanceof Date) {
            formattedUser.lastLogin = user.lastLogin.toISOString();
          }
          
          if (user.lastActivity && user.lastActivity instanceof Date) {
            formattedUser.lastActivity = user.lastActivity.toISOString();
          }
          
          if (user.emailVerified && user.emailVerified instanceof Date) {
            formattedUser.emailVerified = user.emailVerified.toISOString();
          }
          
          // Copiar outros campos
          Object.keys(user).forEach((key) => {
            if (!['createdAt', 'updatedAt', 'lastLogin', 'lastActivity', 'emailVerified'].includes(key)) {
              formattedUser[key] = user[key as keyof typeof user];
            }
          });
          
          return formattedUser;
        });
        break;
        
      case 'activities':
        // Definir campos a incluir
        const activitySelect: Record<string, unknown> = {
          id: true,
          createdAt: true,
          action: true,
        };
        
        if (options.includeFields?.personalInfo) {
          activitySelect.userId = true;
          activitySelect.user = {
            select: {
              name: true,
              email: true,
            },
          };
        }
        
        if (options.includeFields?.activityData) {
          activitySelect.details = true;
          activitySelect.ipAddress = true;
          activitySelect.userAgent = true;
        }
        
        // Construir filtro
        const activityWhere: Record<string, unknown> & {
          createdAt?: {
            gte?: Date;
            lt?: Date;
          };
        } = {};
        
        if (startDate || endDate) {
          activityWhere.createdAt = {};
          
          if (startDate) {
            activityWhere.createdAt.gte = startDate;
          }
          
          if (endDate) {
            activityWhere.createdAt.lt = endDate;
          }
        }
        
        // Buscar atividades
        const activities = await prisma.activity.findMany({
          select: activitySelect,
          where: activityWhere,
          orderBy: { createdAt: 'desc' },
        });
        
        // Formatar dados
        results = activities.map((activity) => {
          const formattedActivity: Record<string, unknown> = {
            id: activity.id,
            action: activity.action,
            createdAt: typeof activity.createdAt === 'object' && activity.createdAt && 'toISOString' in activity.createdAt ? (activity.createdAt as Date).toISOString() : activity.createdAt,
          };
          
          if (activity.userId) {
            formattedActivity.userId = activity.userId;
          }
          
          if (activity.user && typeof activity.user === 'object') {
            formattedActivity.userName = (activity.user as any).name;
            formattedActivity.userEmail = (activity.user as any).email;
          }
          
          if (activity.details) {
            formattedActivity.details = activity.details;
          }
          
          if (activity.ipAddress) {
            formattedActivity.ipAddress = activity.ipAddress;
          }
          
          if (activity.userAgent) {
            formattedActivity.userAgent = activity.userAgent;
          }
          
          return formattedActivity;
        });
        break;
        
      case 'exams':
        // Dados simulados para exames
        results = [
          {
            id: '1',
            fileName: 'exame1.pdf',
            processedAt: new Date().toISOString(),
            userId: '1',
            userName: 'Usuário Teste',
            summary: 'Resumo do exame 1',
          },
          {
            id: '2',
            fileName: 'exame2.pdf',
            processedAt: new Date().toISOString(),
            userId: '2',
            userName: 'Outro Usuário',
            summary: 'Resumo do exame 2',
          },
        ];
        break;
        
      default:
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Tipo de dados inválido',
            message: 'O tipo de dados especificado não é válido',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
    
    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email: token.email } }))!.id,
        action: 'export_data',
        details: `Exportação de dados: ${dataType} (formato: ${format})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        format,
        dataType,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao exportar dados',
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno ao processar sua solicitação',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
