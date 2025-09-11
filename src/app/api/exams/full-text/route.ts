import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getToken } from 'next-auth/jwt'
import { decryptData } from '@/utils/crypto'
import { rateLimit } from '@/utils/rate-limit'

// Verificar se o usuário está autorizado (admin)
async function isUserAuthorized(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "um-segredo-muito-seguro-que-deve-ser-substituido",
  })

  return token?.role === 'admin'
}

export async function GET(request: NextRequest) {
  // Aplicar rate limiting - 20 requisições por minuto
  const rateLimitResponse = rateLimit(request, 20, 60 * 1000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Verificar se o usuário está autorizado
    if (!await isUserAuthorized(request)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Não autorizado',
          details: 'Você não tem permissão para acessar o texto completo dos exames'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Caminho para o arquivo de dados completos
    const dataDir = path.join(process.cwd(), 'data')
    const resultsPath = path.join(dataDir, 'exam-results.json')

    // Verificar se o arquivo existe
    if (!fs.existsSync(resultsPath)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dados não encontrados',
          details: 'Nenhum resultado de exame foi processado ainda'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Ler o arquivo
    const fileContent = fs.readFileSync(resultsPath, 'utf-8')
    const results = JSON.parse(fileContent)

    // Retornar apenas os campos necessários para reduzir o tamanho da resposta
    const sanitizedResults = results.map((result: Record<string, unknown>) => {
      // Descriptografar o texto completo se existir
      let textoCompleto = '';
      if (result.textoCompleto) {
        try {
          const decrypted = decryptData(result.textoCompleto as string);
          textoCompleto = decrypted || (result.textoResumido as string) || '';
        } catch (error) {
          console.error('Erro ao descriptografar texto:', error);
          textoCompleto = (result.textoResumido as string) || '';
        }
      } else {
        textoCompleto = (result.textoResumido as string) || '';
      }

      return {
        fileName: result.fileName,
        textoCompleto,
        processedAt: result.processedAt
      };
    })

    return new NextResponse(
      JSON.stringify(sanitizedResults),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Erro ao buscar texto completo dos exames:', error)

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao buscar texto completo',
        details: 'Ocorreu um erro interno ao processar sua solicitação'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
