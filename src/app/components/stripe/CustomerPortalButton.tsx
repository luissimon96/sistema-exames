'use client'

import { useState } from 'react'

interface CustomerPortalButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function CustomerPortalButton({
  className = '',
  children,
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePortalAccess = async () => {
    try {
      setLoading(true)

      // Chamar a API para criar uma sessão do portal do cliente
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao acessar portal do cliente')
      }

      // Redirecionar para a URL do portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Erro ao acessar portal do cliente:', error)
      alert('Ocorreu um erro ao acessar o portal do cliente. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePortalAccess}
      disabled={loading}
      className={`${className} ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {loading ? 'Processando...' : children || 'Gerenciar Assinatura'}
    </button>
  )
}
