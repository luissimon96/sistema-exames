import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';

// Desativar o parsing do corpo da requisição
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para ler o corpo da requisição como texto
async function readBody(readable: ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function POST(req: NextRequest) {
  try {
    // Obter o corpo da requisição como texto
    const body = await readBody(req.body as ReadableStream);
    
    // Obter o cabeçalho de assinatura do Stripe
    const signature = headers().get('stripe-signature') || '';
    
    // Verificar a assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('Erro ao verificar assinatura do webhook:', err);
      return NextResponse.json(
        { success: false, error: 'Assinatura inválida' },
        { status: 400 }
      );
    }

    // Processar o evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar webhook',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Manipuladores de eventos

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Obter o ID do usuário dos metadados
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('ID do usuário não encontrado nos metadados da sessão');
    return;
  }

  // Atualizar o usuário com o ID do cliente do Stripe (caso ainda não tenha)
  if (session.customer) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: session.customer.toString() },
    });
  }

  console.log(`Checkout concluído para o usuário ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Obter o ID do cliente do Stripe
  const stripeCustomerId = subscription.customer.toString();

  // Buscar o usuário pelo ID do cliente do Stripe
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId },
  });

  if (!user) {
    console.error(`Usuário não encontrado para o cliente ${stripeCustomerId}`);
    return;
  }

  // Determinar o plano com base no ID do preço
  let plan: 'free' | 'pro' | 'full' = 'free';
  const priceId = subscription.items.data[0]?.price.id;
  
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    plan = 'pro';
  } else if (priceId === process.env.STRIPE_FULL_PRICE_ID) {
    plan = 'full';
  }

  // Atualizar o usuário com as informações da assinatura
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlan: plan,
      subscriptionPeriodStart: new Date(subscription.current_period_start * 1000),
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
      subscriptionCanceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  console.log(`Assinatura ${subscription.id} atualizada para o usuário ${user.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Obter o ID do cliente do Stripe
  const stripeCustomerId = subscription.customer.toString();

  // Buscar o usuário pelo ID do cliente do Stripe
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId },
  });

  if (!user) {
    console.error(`Usuário não encontrado para o cliente ${stripeCustomerId}`);
    return;
  }

  // Atualizar o usuário com as informações da assinatura
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionPlan: 'free',
      subscriptionCanceledAt: new Date(),
    },
  });

  console.log(`Assinatura ${subscription.id} cancelada para o usuário ${user.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Processar pagamento bem-sucedido, se necessário
  console.log(`Pagamento bem-sucedido para a fatura ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Obter o ID do cliente do Stripe
  const stripeCustomerId = invoice.customer?.toString();
  if (!stripeCustomerId) return;

  // Buscar o usuário pelo ID do cliente do Stripe
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId },
  });

  if (!user) {
    console.error(`Usuário não encontrado para o cliente ${stripeCustomerId}`);
    return;
  }

  // Atualizar o status da assinatura para 'past_due'
  if (user.subscriptionId) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });
  }

  console.log(`Pagamento falhou para a fatura ${invoice.id} do usuário ${user.id}`);
}
