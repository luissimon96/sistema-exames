'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApiError {
  success: false
  error: string
  details?: string
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
      setError(null)
      setDebugInfo(null)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Por favor, selecione pelo menos um arquivo')
      return
    }

    setUploading(true)
    setError(null)
    setDebugInfo(null)

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      console.log('Iniciando upload dos arquivos...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Status da resposta:', response.status)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))

      // Tentar ler o corpo da resposta como texto primeiro
      const responseText = await response.text()
      console.log('Resposta bruta:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError)
        setDebugInfo(`Resposta inválida do servidor: ${responseText.substring(0, 150)}...`)
        throw new Error('Resposta inválida do servidor')
      }

      if (response.ok && data.success) {
        console.log('Upload bem-sucedido:', data)
        router.push('/dashboard')
      } else {
        console.error('Erro na resposta:', data)
        throw new Error(data.error || 'Falha no upload dos arquivos')
      }
    } catch (error) {
      console.error('Erro detalhado:', error)
      setError(error instanceof Error ? error.message : 'Erro ao fazer upload dos arquivos')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upload de Exames Médicos
          </h2>
          <p className="text-gray-600 mb-8">
            Selecione um ou mais arquivos PDF de exames médicos para análise
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {debugInfo && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
            <p className="font-bold">Informações de Debug:</p>
            <pre className="mt-2 text-sm whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}

        <div className="mt-4">
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="mt-2 text-base leading-normal text-gray-600">
                    {files.length > 0
                      ? `${files.length} arquivo(s) selecionado(s)`
                      : 'Selecione arquivos PDF'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </div>
              </label>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">Arquivos selecionados:</h3>
              <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${files.length === 0 || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
              {uploading ? 'Processando...' : 'Processar Exames'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 