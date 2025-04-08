'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setDebugInfo(null)

      console.log('Tentando login com:', { email, password: '***' })

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      console.log('Resultado do login:', result)

      if (result?.error) {
        setError(`Credenciais inválidas: ${result.error}`)
        setDebugInfo(JSON.stringify(result, null, 2))
      } else {
        setDebugInfo('Login bem-sucedido! Redirecionando...')
        // Pequeno atraso para mostrar a mensagem de sucesso
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login')
      console.error('Erro de login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Login
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {debugInfo && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{debugInfo}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Senha
              </label>
              <div className="text-sm">
                <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="flex justify-between space-x-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('admin123');
              }}
              className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1 px-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              Preencher Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('user@example.com');
                setPassword('user123');
              }}
              className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1 px-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              Preencher Usuário
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Registre-se
          </Link>
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-center text-sm text-gray-500">
            <strong>Credenciais de teste:</strong><br />
            Admin: admin@example.com / admin123<br />
            Usuário: user@example.com / user123
          </p>
        </div>
      </div>
    </div>
  )
}
