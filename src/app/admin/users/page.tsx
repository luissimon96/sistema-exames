'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserStatistics from '@/components/admin/UserStatistics'
import ActivityLogs from '@/components/admin/ActivityLogs'
import DataExport from '@/components/admin/DataExport'

type User = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  isActive: boolean
}

export default function AdminUsers() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  // Estado para controlar a guia ativa
  const [activeTab, setActiveTab] = useState('users') // 'users', 'statistics', 'logs', 'export'

  // Verificar se o usuário é admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [session, status, router, currentPage, searchTerm])

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/users?page=${currentPage}&search=${searchTerm}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao buscar os usuários')
      console.error('Erro ao buscar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  // Função para exportar dados
  const handleExportData = async (format: string, dataType: string, options: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/export?format=${format}&dataType=${dataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar dados')
      }

      const data = await response.json()
      return data.results
    } catch (err) {
      console.error('Erro ao exportar dados:', err)
      throw err
    }
  }

  // Abrir modal de edição
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditName(user.name || '')
    setEditRole(user.role)
    setEditIsActive(user.isActive)
    setShowEditModal(true)
  }

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          isActive: editIsActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário')
      }

      // Atualizar lista de usuários
      fetchUsers()
      setShowEditModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar o usuário')
      console.error('Erro ao atualizar usuário:', err)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de exclusão
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário')
      }

      // Atualizar lista de usuários
      fetchUsers()
      setShowDeleteModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao excluir o usuário')
      console.error('Erro ao excluir usuário:', err)
    } finally {
      setLoading(false)
    }
  }

  // Renderizar mensagem de carregamento
  if (status === 'loading') {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="text-center">
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar mensagem se não for admin
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="text-center">
            <p className="mt-4 text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-6xl">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 mb-6">
          Painel de Administração
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Guias de navegação */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Estatísticas
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Logs de Atividade
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Exportação de Dados
            </button>
          </nav>
        </div>

        {/* Conteúdo da guia Usuários */}
        {activeTab === 'users' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciamento de Usuários</h3>

            {/* Barra de pesquisa e filtros */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${!searchTerm && 'hidden'}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={fetchUsers}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {loading ? 'Carregando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {/* Tabela de usuários */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de Criação
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          {loading ? 'Carregando usuários...' : 'Nenhum usuário encontrado'}
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name || 'Sem nome'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo da guia Estatísticas */}
        {activeTab === 'statistics' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
            <UserStatistics />
          </div>
        )}

        {/* Conteúdo da guia Logs de Atividade */}
        {activeTab === 'logs' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
            <ActivityLogs />
          </div>
        )}

        {/* Conteúdo da guia Exportação de Dados */}
        {activeTab === 'export' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
            <DataExport onExport={handleExportData} />
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Editar Usuário</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Função
                </label>
                <select
                  id="role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de exclusão */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir o usuário <span className="font-semibold">{selectedUser.email}</span>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
