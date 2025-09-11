import Stripe from 'stripe';
import prisma from './prisma';

// Inicializar o cliente Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Usar a versão mais recente da API
});

// Tipos para os planos de assinatura
export type SubscriptionPlan = 'free' | 'pro' | 'full';

// Mapeamento de planos para IDs de preço no Stripe
const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  full: process.env.STRIPE_FULL_PRICE_ID || '',
};

/**
 * Cria ou recupera um cliente no Stripe
 */
export async function getOrCreateCustomer(userId: string, email: string, name?: string) {
  // Buscar usuário no banco de dados para verificar se já tem um customerId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  // Se o usuário já tem um customerId, retornar o cliente existente
  if (user?.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    if (!customer.deleted) {
      return customer;
    }
  }

  // Criar um novo cliente no Stripe
  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: {
      userId,
    },
  });

  // Atualizar o usuário com o novo customerId
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

/**
 * Cria uma sessão de checkout para assinatura
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: 'pro' | 'full',
  name?: string,
  trial?: boolean
) {
  // Obter ou criar o cliente no Stripe
  const customer = await getOrCreateCustomer(userId, email, name);

  // Criar a sessão de checkout
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: trial
      ? {
          trial_period_days: 14, // Período de teste de 14 dias
        }
      : undefined,
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?subscription=canceled`,
    metadata: {
      userId,
      plan,
    },
  });

  return session;
}

/**
 * Cria um portal de cliente para gerenciar assinatura
 */
export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });

  return session;
}

/**
 * Cancela uma assinatura
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Reativa uma assinatura cancelada
 */
export async function reactivateSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Atualiza o plano de assinatura
 */
export async function updateSubscriptionPlan(subscriptionId: string, plan: 'pro' | 'full') {
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
        price: PRICE_IDS[plan],
      },
    ],
  });
}

/**
 * Verifica o status de uma assinatura
 */
export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.status;
}

export default stripe;
