'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Obter o token da URL
    const tokenFromUrl = searchParams.get('token')
    setToken(tokenFromUrl)
    
    if (!tokenFromUrl) {
      setError('Token de redefinição de senha não encontrado')
      setValidating(false)
      return
    }
    
    // Validar o token
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${tokenFromUrl}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Token inválido ou expirado')
        }
        
        setTokenValid(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Token inválido ou expirado')
        setTokenValid(false)
      } finally {
        setValidating(false)
      }
    }
    
    validateToken()
  }, [searchParams])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError('Token de redefinição de senha não encontrado')
      return
    }
    
    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha')
      }
      
      setSuccess(true)
      
      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir a senha')
      console.error('Erro ao redefinir senha:', err)
    } finally {
      setLoading(false)
    }
  }

  // Renderizar mensagem de carregamento enquanto valida o token
  if (validating) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="text-center">
            <p className="mt-4 text-gray-600">Validando token de redefinição de senha...</p>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar mensagem de erro se o token for inválido
  if (tokenValid === false) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Token inválido ou expirado</p>
            <p>O link de redefinição de senha é inválido ou expirou.</p>
            <p className="mt-4">
              <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                Solicitar um novo link
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Redefinir Senha
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Senha redefinida com sucesso!</p>
            <p>Você será redirecionado para a página de login em instantes.</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Nova Senha
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                Confirmar Nova Senha
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          Lembrou sua senha?{' '}
          <Link href="/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
