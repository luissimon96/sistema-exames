import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar informações da assinatura do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionPeriodStart: true,
        subscriptionPeriodEnd: true,
        subscriptionCanceledAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Formatar as informações da assinatura
    const subscription = {
      id: user.subscriptionId,
      status: user.subscriptionStatus || 'inactive',
      plan: user.subscriptionPlan || 'free',
      currentPeriodStart: user.subscriptionPeriodStart
        ? user.subscriptionPeriodStart.toISOString()
        : null,
      currentPeriodEnd: user.subscriptionPeriodEnd
        ? user.subscriptionPeriodEnd.toISOString()
        : null,
      canceledAt: user.subscriptionCanceledAt
        ? user.subscriptionCanceledAt.toISOString()
        : null,
    };

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Erro ao buscar informações da assinatura:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar informações da assinatura',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
