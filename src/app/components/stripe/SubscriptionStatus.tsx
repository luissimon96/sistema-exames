'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import CustomerPortalButton from './CustomerPortalButton'

interface SubscriptionInfo {
  plan: string
  status: string
  currentPeriodEnd: string | null
  canceledAt: string | null
}

export default function SubscriptionStatus() {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user) return

      try {
        const response = await fetch('/api/user/subscription')
        if (!response.ok) throw new Error('Falha ao buscar informações da assinatura')
        
        const data = await response.json()
        setSubscription(data.subscription)
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [session])

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Plano Atual: Gratuito</h3>
        <p className="mt-2 text-sm text-gray-600">
          Você está usando o plano gratuito com recursos limitados.
        </p>
        <div className="mt-4">
          <a
            href="/pricing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Fazer upgrade
          </a>
        </div>
      </div>
    )
  }

  // Formatar data de término do período atual
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
    : 'N/A'

  // Determinar status da assinatura em português
  let statusText = 'Ativa'
  let statusColor = 'text-green-600'

  switch (subscription.status) {
    case 'trialing':
      statusText = 'Em período de teste'
      statusColor = 'text-blue-600'
      break
    case 'active':
      statusText = 'Ativa'
      statusColor = 'text-green-600'
      break
    case 'past_due':
      statusText = 'Pagamento pendente'
      statusColor = 'text-yellow-600'
      break
    case 'canceled':
      statusText = 'Cancelada'
      statusColor = 'text-red-600'
      break
    case 'unpaid':
      statusText = 'Não paga'
      statusColor = 'text-red-600'
      break
    default:
      statusText = 'Inativa'
      statusColor = 'text-gray-600'
  }

  // Determinar nome do plano em português
  let planName = 'Gratuito'
  switch (subscription.plan) {
    case 'pro':
      planName = 'Profissional'
      break
    case 'full':
      planName = 'Completo'
      break
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Plano Atual: {planName}</h3>
          <p className="mt-2 text-sm text-gray-600">
            Status: <span className={statusColor}>{statusText}</span>
          </p>
          {subscription.currentPeriodEnd && (
            <p className="mt-1 text-sm text-gray-600">
              {subscription.canceledAt
                ? `Acesso até: ${periodEnd}`
                : `Próxima cobrança: ${periodEnd}`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <CustomerPortalButton className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Gerenciar Assinatura
        </CustomerPortalButton>
      </div>
    </div>
  )
}
