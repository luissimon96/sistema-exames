import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await req.json();
    const { plan, trial = false } = data;

    // Validar o plano
    if (!plan || !['pro', 'full'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Plano inválido' },
        { status: 400 }
      );
    }

    // Criar sessão de checkout
    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email || '',
      plan as 'pro' | 'full',
      session.user.name || undefined,
      trial
    );

    // Retornar URL da sessão de checkout
    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar sessão de checkout',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
