'use client'

import { useEffect, useState, useRef } from 'react'
import { generateCsrfToken } from '@/utils/csrf'

interface CsrfTokenProps {
  onTokenGenerated?: (token: string) => void;
}

export default function CsrfToken({ onTokenGenerated }: CsrfTokenProps) {
  const [token, setToken] = useState<string>('')

  // Usar uma ref para armazenar a callback para evitar re-renderizações
  const onTokenGeneratedRef = useRef(onTokenGenerated)

  // Atualizar a ref quando a prop mudar
  useEffect(() => {
    onTokenGeneratedRef.current = onTokenGenerated
  }, [onTokenGenerated])

  // Efeito para gerar o token apenas uma vez na montagem
  useEffect(() => {
    // Verificar se já existe um token no cookie
    const existingToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];

    // Se já existe um token válido, usar ele
    if (existingToken) {
      setToken(existingToken);

      // Notificar o componente pai sobre o token existente
      if (onTokenGeneratedRef.current) {
        onTokenGeneratedRef.current(existingToken);
      }
      return;
    }

    // Se não existe token, gerar um novo
    const newToken = generateCsrfToken();
    setToken(newToken);

    // Armazenar o token em um cookie
    document.cookie = `csrf_token=${newToken}; path=/; max-age=3600; SameSite=Strict`;

    // Notificar o componente pai, se necessário
    if (onTokenGeneratedRef.current) {
      onTokenGeneratedRef.current(newToken);
    }
  }, [])

  return (
    <input type="hidden" name="csrf_token" value={token} />
  )
}
