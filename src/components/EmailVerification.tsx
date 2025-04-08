'use client'

import { useState } from 'react'

interface EmailVerificationProps {
  email: string
  isVerified: boolean
  onRequestVerification: () => Promise<void>
  onVerifyCode: (code: string) => Promise<boolean>
}

export default function EmailVerification({
  email,
  isVerified,
  onRequestVerification,
  onVerifyCode,
}: EmailVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  
  // Solicitar verificação de email
  const handleRequestVerification = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      await onRequestVerification()
      
      setSuccess('Um código de verificação foi enviado para o seu email.')
      setShowVerificationForm(true)
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao solicitar a verificação de email.')
    } finally {
      setLoading(false)
    }
  }
  
  // Verificar código
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Por favor, insira o código de verificação.')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const result = await onVerifyCode(verificationCode)
      
      if (result) {
        setSuccess('Email verificado com sucesso!')
        setShowVerificationForm(false)
      } else {
        setError('Código de verificação inválido. Por favor, tente novamente.')
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao verificar o código.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">Verificação de Email</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isVerified
              ? 'Seu email está verificado.'
              : 'Verifique seu email para aumentar a segurança da sua conta.'}
          </p>
        </div>
        <div>
          {isVerified ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              Verificado
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              Não verificado
            </span>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      {!isVerified && (
        <div>
          {showVerificationForm ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600">
                Um código de verificação foi enviado para <strong>{email}</strong>.
                Por favor, insira o código abaixo para verificar seu email.
              </p>
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Código de verificação"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
              
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestVerification}
              disabled={loading}
              className={`mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Enviando...' : 'Verificar Email'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
