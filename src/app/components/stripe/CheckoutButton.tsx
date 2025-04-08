'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface CheckoutButtonProps {
  plan: 'pro' | 'full'
  className?: string
  children?: React.ReactNode
  trial?: boolean
}

export default function CheckoutButton({
  plan,
  className = '',
  children,
  trial = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleCheckout = async () => {
    // Se o usuário não estiver autenticado, redirecionar para a página de login
    if (!session) {
      router.push(`/login?callbackUrl=/pricing&plan=${plan}`)
      return
    }

    try {
      setLoading(true)

      // Chamar a API para criar uma sessão de checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, trial }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout')
      }

      // Redirecionar para a URL de checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error)
      alert('Ocorreu um erro ao processar o checkout. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${className} ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {loading ? 'Processando...' : children || `Assinar ${plan.toUpperCase()}`}
    </button>
  )
}
