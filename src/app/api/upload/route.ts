import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import fs from 'fs'
import path from 'path'

interface ExamResult {
  fileName: string
  hemoglobina?: number | null
  glicose?: number | null
  colesterolTotal?: number | null
  triglicerides?: number | null
  hdl?: number | null
  ldl?: number | null
  vldl?: number | null
  plaquetas?: number | null
  leucocitos?: number | null
  rawText?: string
  error?: string
  processedAt: string
}

declare global {
  // eslint-disable-next-line no-var
  var examResults: ExamResult[]
}

export async function POST(request: NextRequest) {
  console.log('Iniciando processamento da requisição POST...')

  try {
    const contentType = request.headers.get('content-type')
    console.log('Content-Type da requisição:', contentType)

    if (!contentType?.includes('multipart/form-data')) {
      console.error('Content-Type inválido:', contentType)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Content-Type inválido',
          details: 'A requisição deve ser multipart/form-data'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files')
    console.log(`Recebidos ${files.length} arquivo(s)`)

    if (!files || files.length === 0) {
      console.error('Nenhum arquivo recebido')
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Nenhum arquivo foi enviado',
          details: 'É necessário enviar pelo menos um arquivo PDF'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const results: ExamResult[] = []

    for (const file of files) {
      if (!(file instanceof File)) {
        console.error('Item não é um arquivo:', typeof file)
        continue
      }

      console.log(`Processando arquivo: ${file.name} (${file.size} bytes)`)

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        console.log(`Iniciando parse do PDF: ${file.name}`)
        const data = await pdfParse(buffer)
        console.log(`PDF parseado com sucesso: ${file.name} (${data.text.length} caracteres)`)

        const examData = extractExamData(data.text)
        console.log(`Dados extraídos do arquivo ${file.name}:`, examData)

        results.push({
          fileName: file.name,
          ...examData,
          processedAt: new Date().toISOString()
        })

        console.log(`Arquivo ${file.name} processado com sucesso`)
      } catch (fileError) {
        console.error(`Erro detalhado ao processar arquivo ${file.name}:`, fileError)
        results.push({
          fileName: file.name,
          error: fileError instanceof Error ?
            `${fileError.name}: ${fileError.message}` :
            'Erro desconhecido ao processar arquivo',
          processedAt: new Date().toISOString()
        })
      }
    }

    console.log(`Processamento concluído. ${results.length} resultado(s)`)
    global.examResults = results

    // Salvar resultados em um arquivo JSON na pasta public
    try {
      const publicDir = path.join(process.cwd(), 'public')

      // Criar pasta public se não existir
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }

      const resultsPath = path.join(publicDir, 'exam-results.json')
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
      console.log(`Resultados salvos em: ${resultsPath}`)
    } catch (fsError) {
      console.error('Erro ao salvar arquivo de resultados:', fsError)
      // Não falhar por causa do arquivo, apenas logar o erro
    }

    const response = {
      success: true,
      results,
      message: `${results.length} arquivo(s) processado(s) com sucesso`
    }

    console.log('Enviando resposta:', response)
    return new NextResponse(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Erro crítico no processamento:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar arquivos',
        details: error instanceof Error ?
          `${error.name}: ${error.message}` :
          'Erro interno do servidor',
        stack: process.env.NODE_ENV === 'development' ?
          error instanceof Error ? error.stack : undefined :
          undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

function extractExamData(text: string): Omit<ExamResult, 'fileName' | 'processedAt'> {
  console.log('Iniciando extração de dados do texto...')

  const extractNumber = (match: RegExpMatchArray | null): number | null => {
    if (!match || !match[1]) return null
    const value = match[1].replace(',', '.').trim()
    const parsed = parseFloat(value)
    console.log(`Extraindo número: "${value}" => ${isNaN(parsed) ? 'NaN' : parsed}`)
    return isNaN(parsed) ? null : parsed
  }

  const patterns = {
    hemoglobina: /Hemoglobina[:\s]+(\d+[.,]?\d*)/i,
    glicose: /Glicose[:\s]+(\d+[.,]?\d*)/i,
    colesterolTotal: /Colesterol Total[:\s]+(\d+[.,]?\d*)/i,
    triglicerides: /Triglicer[íi]deos[:\s]+(\d+[.,]?\d*)/i,
    hdl: /HDL[:\s]+(\d+[.,]?\d*)/i,
    ldl: /LDL[:\s]+(\d+[.,]?\d*)/i,
    vldl: /VLDL[:\s]+(\d+[.,]?\d*)/i,
    plaquetas: /Plaquetas[:\s]+(\d+[.,]?\d*)/i,
    leucocitos: /Leuc[óo]citos[:\s]+(\d+[.,]?\d*)/i
  }

  const results: Record<string, number | null> = {}

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    results[key] = extractNumber(match)
    console.log(`Resultado para ${key}:`, results[key])
  }

  const output = {
    ...results,
    rawText: text.substring(0, 1000)
  }

  console.log('Extração de dados concluída')
  return output
} 