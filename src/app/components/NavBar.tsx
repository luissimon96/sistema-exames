'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function NavBar() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'

  // Log do estado da sessão para depuração
  console.log('NavBar - Status da sessão:', status)
  console.log('NavBar - Dados da sessão:', session)

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-800">ExamAnalyzer</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/upload"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Upload
              </Link>
              <Link href="/dashboard"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/raw-data"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Dados Brutos
              </Link>
              <Link href="/pricing"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Planos
              </Link>
              {session?.user?.role === 'admin' && (
                <Link href="/admin/users"
                  className="border-transparent text-purple-500 hover:border-purple-300 hover:text-purple-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {status === 'loading' ? (
              <span className="text-sm text-gray-500">Carregando...</span>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Olá, {session?.user?.name || 'Usuário'}
                  {session?.user?.role && (
                    <span className="ml-1 text-xs text-gray-500">({session.user.role})</span>
                  )}
                </span>
                <Link href="/profile"
                  className="text-gray-500 hover:text-gray-700 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
                >
                  Perfil
                </Link>
                <button
                  onClick={() => {
                    console.log('Fazendo logout...');
                    signOut({ callbackUrl: '/' });
                  }}
                  className="text-gray-500 hover:text-gray-700 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link href="/login"
                className="text-gray-500 hover:text-gray-700 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
