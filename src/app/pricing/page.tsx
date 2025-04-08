'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PricingSection from '../components/landing/PricingSection'

export default function PricingPage() {
  const searchParams = useSearchParams()
  const subscription = searchParams.get('subscription')
  const { data: session } = useSession()

  useEffect(() => {
    // Mostrar mensagem se o usuário cancelou o checkout
    if (subscription === 'canceled') {
      alert('Checkout cancelado. Você pode tentar novamente quando quiser.')
    }
  }, [subscription])

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planos e Preços
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Escolha o plano ideal para suas necessidades
          </p>
        </div>

        <PricingSection />

        {session && (
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Já é assinante? Acesse o{' '}
              <a
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Dashboard
              </a>{' '}
              para gerenciar sua assinatura.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
