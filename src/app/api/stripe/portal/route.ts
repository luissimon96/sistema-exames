import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createCustomerPortalSession } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    // Verificar se o usuário tem um ID de cliente no Stripe
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não possui assinatura' },
        { status: 400 }
      );
    }

    // Criar sessão do portal do cliente
    const portalSession = await createCustomerPortalSession(user.stripeCustomerId);

    // Retornar URL da sessão do portal
    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar sessão do portal',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
