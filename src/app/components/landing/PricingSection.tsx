'use client'

import { CheckIcon } from '@heroicons/react/24/outline'
import CheckoutButton from '../stripe/CheckoutButton'

const tiers = [
  {
    name: 'Basic',
    id: 'tier-basic',
    href: '/register',
    price: 'Grátis',
    description: 'Perfeito para começar a entender seus exames.',
    features: [
      'Até 5 exames por mês',
      'Análise básica de resultados',
      'Histórico de 3 meses',
      'Explicações simplificadas',
      'Acesso via web',
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/register?plan=pro',
    price: 'R$ 29,90',
    description: 'Ideal para quem precisa de um acompanhamento regular.',
    features: [
      'Até 20 exames por mês',
      'Análise avançada com comparativos',
      'Histórico completo',
      'Alertas personalizados',
      'Compartilhamento com médicos',
      'Acesso via web e aplicativo',
      'Suporte prioritário',
    ],
    mostPopular: true,
  },
  {
    name: 'Full',
    id: 'tier-full',
    href: '/register?plan=full',
    price: 'R$ 59,90',
    description: 'Para quem precisa do máximo em análise e acompanhamento.',
    features: [
      'Exames ilimitados',
      'Análise completa com IA avançada',
      'Histórico completo com insights',
      'Alertas e recomendações personalizadas',
      'Compartilhamento ilimitado',
      'Acesso em todos os dispositivos',
      'Suporte 24/7 dedicado',
      'Consultas online com especialistas',
    ],
    mostPopular: false,
  },
]

export default function PricingSection() {
  return (
    <div id="pricing" className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase text-center">Planos</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl text-center">
            Escolha o plano ideal para você
          </p>
          <p className="mt-5 text-xl text-gray-500 max-w-3xl mx-auto text-center">
            Temos opções para todos os perfis, desde usuários ocasionais até quem precisa de um acompanhamento completo de saúde.
          </p>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-lg shadow-sm divide-y divide-gray-200 ${
                tier.mostPopular ? 'border-2 border-blue-500' : 'border border-gray-200'
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute inset-x-0 top-0 transform translate-y-px">
                  <div className="flex justify-center transform -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white">
                      Mais Popular
                    </span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">{tier.name}</h2>
                <p className="mt-4 text-sm text-gray-500">{tier.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
                  {tier.name !== 'Basic' && <span className="text-base font-medium text-gray-500">/mês</span>}
                </p>
                {tier.name === 'Basic' ? (
                  <a
                    href="/register"
                    className="mt-8 block w-full py-2 px-4 border border-transparent rounded-md text-center font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Começar Grátis
                  </a>
                ) : (
                  <CheckoutButton
                    plan={tier.name.toLowerCase() as 'pro' | 'full'}
                    trial={true}
                    className={`mt-8 block w-full py-2 px-4 border border-transparent rounded-md text-center font-medium ${
                      tier.mostPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Experimentar Grátis
                  </CheckoutButton>
                )}
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">O que está incluído</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
