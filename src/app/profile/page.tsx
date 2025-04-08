'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import ImageCropper from '@/components/ImageCropper'
import ThemeSelector from '@/components/ThemeSelector'
import SocialMediaLinks from '@/components/SocialMediaLinks'
import EmailVerification from '@/components/EmailVerification'

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Campos adicionais de perfil
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)

  // Redes sociais
  const [facebookUrl, setFacebookUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  // Personalização
  const [theme, setTheme] = useState('light')
  const [accentColor, setAccentColor] = useState('#3b82f6')

  // Recorte de imagem
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState('')

  // Verificação de email
  const [emailVerified, setEmailVerified] = useState(false)

  // Estado para autenticação de dois fatores
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')

  // Carregar dados do usuário
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')

      // Carregar dados completos do perfil
      const loadProfileData = async () => {
        try {
          const response = await fetch('/api/user/profile')
          const data = await response.json()

          if (response.ok) {
            // Preencher campos adicionais
            setBio(data.bio || '')
            setLocation(data.location || '')
            setWebsite(data.website || '')
            setPhoneNumber(data.phoneNumber || '')
            setJobTitle(data.jobTitle || '')
            setCompany(data.company || '')
            setProfileImage(data.image || null)

            // Redes sociais
            setFacebookUrl(data.facebookUrl || '')
            setTwitterUrl(data.twitterUrl || '')
            setLinkedinUrl(data.linkedinUrl || '')
            setInstagramUrl(data.instagramUrl || '')
            setGithubUrl(data.githubUrl || '')

            // Personalização
            setTheme(data.theme || 'light')
            setAccentColor(data.accentColor || '#3b82f6')

            // Verificação de email
            setEmailVerified(!!data.emailVerified)
          }
        } catch (err) {
          console.error('Erro ao carregar dados do perfil:', err)
        }
      }

      loadProfileData()

      // Verificar se o 2FA está habilitado
      const checkTwoFactorStatus = async () => {
        try {
          const response = await fetch('/api/user/two-factor-status')
          const data = await response.json()

          if (response.ok) {
            setTwoFactorEnabled(data.enabled)
          }
        } catch (err) {
          console.error('Erro ao verificar status do 2FA:', err)
        }
      }

      checkTwoFactorStatus()
    }
  }, [session, status, router])

  // Configuração do dropzone para upload de imagem
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedImage(file)

      // Criar preview da imagem para recorte
      const reader = new FileReader()
      reader.onload = () => {
        setImageToCrop(reader.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': []
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  // Atualizar perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Se houver uma imagem para upload, enviar primeiro
      if (uploadedImage) {
        const imageFormData = new FormData()
        imageFormData.append('image', uploadedImage)

        const imageResponse = await fetch('/api/user/upload-image', {
          method: 'POST',
          body: imageFormData,
        })

        if (!imageResponse.ok) {
          throw new Error('Erro ao fazer upload da imagem')
        }
      }

      // Enviar dados do perfil
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
          location,
          website,
          phoneNumber,
          jobTitle,
          company,
          facebookUrl,
          twitterUrl,
          linkedinUrl,
          instagramUrl,
          githubUrl,
          theme,
          accentColor,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil')
      }

      setSuccess('Perfil atualizado com sucesso')
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao atualizar o perfil')
      console.error('Erro ao atualizar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  // Alterar senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha')
      }

      setSuccess('Senha alterada com sucesso')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao alterar a senha')
      console.error('Erro ao alterar senha:', err)
    } finally {
      setLoading(false)
    }
  }

  // Iniciar configuração de 2FA
  const handleSetupTwoFactor = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/setup-two-factor')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao configurar autenticação de dois fatores')
      }

      setTwoFactorSecret(data.secret)
      setShowTwoFactorSetup(true)
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao configurar a autenticação de dois fatores')
      console.error('Erro ao configurar 2FA:', err)
    } finally {
      setLoading(false)
    }
  }

  // Verificar código 2FA e ativar
  const handleEnableTwoFactor = async () => {
    if (!twoFactorCode) {
      setError('Por favor, insira o código de verificação')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/enable-two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: twoFactorSecret,
          code: twoFactorCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar autenticação de dois fatores')
      }

      setTwoFactorEnabled(true)
      setShowTwoFactorSetup(false)
      setSuccess('Autenticação de dois fatores ativada com sucesso')
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao ativar a autenticação de dois fatores')
      console.error('Erro ao ativar 2FA:', err)
    } finally {
      setLoading(false)
    }
  }

  // Desativar 2FA
  const handleDisableTwoFactor = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/disable-two-factor', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desativar autenticação de dois fatores')
      }

      setTwoFactorEnabled(false)
      setSuccess('Autenticação de dois fatores desativada com sucesso')
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao desativar a autenticação de dois fatores')
      console.error('Erro ao desativar 2FA:', err)
    } finally {
      setLoading(false)
    }
  }

  // Renderizar mensagem de carregamento enquanto verifica a sessão
  if (status === 'loading') {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="text-center">
            <p className="mt-4 text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar mensagem se não estiver autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="text-center">
            <p className="mt-4 text-gray-600">Você precisa estar logado para acessar esta página.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Configurações de Perfil
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Seção de Informações Básicas */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Foto de perfil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de Perfil
                </label>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Foto de perfil"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                          <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    {...getRootProps()}
                    className={`flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed'} rounded-md cursor-pointer hover:bg-gray-50 flex-1`}
                  >
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <input {...getInputProps()} />
                        <p className="pl-1">Arraste e solte uma imagem ou clique para selecionar</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Componente de recorte de imagem */}
              {showCropper && (
                <ImageCropper
                  imageSrc={imageToCrop}
                  onCropComplete={(croppedImage) => {
                    setProfileImage(croppedImage)
                    setShowCropper(false)

                    // Converter base64 para File
                    fetch(croppedImage)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' })
                        setUploadedImage(file)
                      })
                  }}
                  onCancel={() => {
                    setShowCropper(false)
                    setUploadedImage(null)
                  }}
                />
              )}

              {/* Verificação de email */}
              <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                <EmailVerification
                  email={email}
                  isVerified={emailVerified}
                  onRequestVerification={async () => {
                    try {
                      const response = await fetch('/api/user/request-email-verification', {
                        method: 'POST',
                      })

                      if (!response.ok) {
                        throw new Error('Erro ao solicitar verificação de email')
                      }
                    } catch (err) {
                      console.error('Erro ao solicitar verificação:', err)
                      throw err
                    }
                  }}
                  onVerifyCode={async (code) => {
                    try {
                      const response = await fetch('/api/user/verify-email', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code }),
                      })

                      if (!response.ok) {
                        return false
                      }

                      setEmailVerified(true)
                      return true
                    } catch (err) {
                      console.error('Erro ao verificar código:', err)
                      return false
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado.</p>
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                    Cargo
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Localização
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Biografia
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-xs text-gray-500">Breve descrição sobre você.</p>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          {/* Seção de Redes Sociais */}
          <div className="p-6 border-b border-gray-200">
            <SocialMediaLinks
              facebookUrl={facebookUrl}
              twitterUrl={twitterUrl}
              linkedinUrl={linkedinUrl}
              instagramUrl={instagramUrl}
              githubUrl={githubUrl}
              onSave={(links) => {
                setFacebookUrl(links.facebookUrl)
                setTwitterUrl(links.twitterUrl)
                setLinkedinUrl(links.linkedinUrl)
                setInstagramUrl(links.instagramUrl)
                setGithubUrl(links.githubUrl)

                // Salvar redes sociais
                fetch('/api/user/update-social-links', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(links),
                })
                  .then(response => {
                    if (response.ok) {
                      setSuccess('Redes sociais atualizadas com sucesso')
                    } else {
                      setError('Erro ao atualizar redes sociais')
                    }
                  })
                  .catch(err => {
                    console.error('Erro ao atualizar redes sociais:', err)
                    setError('Erro ao atualizar redes sociais')
                  })
              }}
            />
          </div>

          {/* Seção de Personalização */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personalização</h3>
            <ThemeSelector
              currentTheme={theme}
              currentAccentColor={accentColor}
              onThemeChange={(newTheme) => {
                setTheme(newTheme)

                // Salvar tema
                fetch('/api/user/update-theme', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ theme: newTheme, accentColor }),
                })
                  .then(response => {
                    if (response.ok) {
                      setSuccess('Tema atualizado com sucesso')
                    } else {
                      setError('Erro ao atualizar tema')
                    }
                  })
                  .catch(err => {
                    console.error('Erro ao atualizar tema:', err)
                    setError('Erro ao atualizar tema')
                  })
              }}
              onAccentColorChange={(newColor) => {
                setAccentColor(newColor)

                // Salvar cor de destaque
                fetch('/api/user/update-theme', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ theme, accentColor: newColor }),
                })
                  .then(response => {
                    if (response.ok) {
                      setSuccess('Cor de destaque atualizada com sucesso')
                    } else {
                      setError('Erro ao atualizar cor de destaque')
                    }
                  })
                  .catch(err => {
                    console.error('Erro ao atualizar cor de destaque:', err)
                    setError('Erro ao atualizar cor de destaque')
                  })
              }}
            />
          </div>

          {/* Seção de Alteração de Senha */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Alterar Senha</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Senha Atual
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Nova Senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>

          {/* Seção de Autenticação de Dois Fatores */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Autenticação de Dois Fatores</h3>

            {twoFactorEnabled ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  A autenticação de dois fatores está <span className="font-semibold text-green-600">ativada</span> para sua conta.
                </p>
                <button
                  onClick={handleDisableTwoFactor}
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {loading ? 'Desativando...' : 'Desativar Autenticação de Dois Fatores'}
                </button>
              </div>
            ) : showTwoFactorSetup ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Escaneie o código QR abaixo com seu aplicativo de autenticação (como Google Authenticator, Authy ou Microsoft Authenticator).
                </p>

                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white border rounded-lg">
                    <QRCodeCanvas
                      value={`otpauth://totp/SistemaExames:${email}?secret=${twoFactorSecret}&issuer=SistemaExames`}
                      size={200}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  Ou insira este código manualmente no seu aplicativo:
                </p>

                <div className="bg-gray-100 p-2 rounded-md font-mono text-center mb-4">
                  {twoFactorSecret}
                </div>

                <div className="space-y-2">
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
                    Código de Verificação
                  </label>
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Digite o código de 6 dígitos"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleEnableTwoFactor}
                    disabled={loading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? 'Verificando...' : 'Verificar e Ativar'}
                  </button>

                  <button
                    onClick={() => setShowTwoFactorSetup(false)}
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo um código além da sua senha ao fazer login.
                </p>
                <button
                  onClick={handleSetupTwoFactor}
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Configurando...' : 'Configurar Autenticação de Dois Fatores'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
