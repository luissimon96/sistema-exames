import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { encryptData } from '@/utils/crypto'
import { rateLimit } from '@/utils/rate-limit'

// Importação dinâmica para evitar problemas durante build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParse: any = null

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
  vhs?: number | null
  tgo?: number | null
  tgp?: number | null
  hematocrito?: number | null
  vcm?: number | null
  hcm?: number | null
  chcm?: number | null
  rdw?: number | null
  creatinina?: number | null
  ureia?: number | null
  acidoUrico?: number | null
  // Campos adicionais
  segmentados?: number | null
  eosinofilos?: number | null
  basofilos?: number | null
  linfocitos?: number | null
  monocitos?: number | null
  vpm?: number | null
  fosfatase?: number | null
  ggt?: number | null
  ferritina?: number | null
  ferro?: number | null
  transferrina?: number | null
  pcr?: number | null
  sodio?: number | null
  potassio?: number | null
  magnesio?: number | null
  calcio?: number | null
  fosforo?: number | null
  bilirubinaTotal?: number | null
  bilirubinaIndireta?: number | null
  bilirubinaDisponivel?: number | null
  glicoseJejum?: number | null
  hemoglobinaGlicosilada?: number | null
  insulina?: number | null
  albumina?: number | null
  vitaminaD?: number | null
  vitaminaB12?: number | null
  tsh?: number | null
  t4Livre?: number | null
  rgf?: number | null // Ritmo de filtração glomerular
  colesterolNaoHdl?: number | null
  textoCompleto: string
  rawText?: string
  error?: string
  processedAt: string
}

declare global {
   
  var examResults: ExamResult[]
}

// Constantes para limites de segurança
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5; // Máximo de 5 arquivos por upload

export async function POST(request: NextRequest) {
  console.log('Iniciando processamento da requisição POST...')
  
  // Carregar pdf-parse dinamicamente
  if (!pdfParse) {
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch (error) {
      console.error('Erro ao carregar pdf-parse:', error);
      return new NextResponse(JSON.stringify({ success: false, error: 'PDF parser unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Aplicar rate limiting - 5 uploads por minuto
  const rateLimitResponse = rateLimit(request, 5, 60 * 1000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Verificar o token CSRF (apenas para debug em desenvolvimento)
  const csrfToken = request.headers.get('X-CSRF-Token');
  console.log('[DEBUG] Token CSRF recebido no upload:', csrfToken ? 'Presente' : 'Ausente');

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

    // Verificar limite de arquivos
    if (files.length > MAX_FILES) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Limite de arquivos excedido',
          details: `O número máximo de arquivos permitido é ${MAX_FILES}`
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

      // Validar tamanho do arquivo
      if (file.size > MAX_FILE_SIZE) {
        console.error(`Arquivo muito grande: ${file.name} (${file.size} bytes)`)
        results.push({
          fileName: file.name,
          error: `Arquivo excede o tamanho máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          textoCompleto: '',
          processedAt: new Date().toISOString()
        })
        continue
      }

      // Validar tipo de arquivo
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        console.error(`Tipo de arquivo inválido: ${file.name} (${file.type})`)
        results.push({
          fileName: file.name,
          error: 'Apenas arquivos PDF são permitidos',
          textoCompleto: '',
          processedAt: new Date().toISOString()
        })
        continue
      }

      console.log(`Processando arquivo: ${file.name} (${file.size} bytes)`)

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        console.log(`Iniciando parse do PDF: ${file.name}`)
        const data = await pdfParse(buffer)
        console.log(`PDF parseado com sucesso: ${file.name} (${data.text.length} caracteres)`)

        // Identificar o separador de exames no PDF
        const separator = '______________________________________________________________________________'

        // Dividir o texto do PDF em múltiplos exames
        const examTexts = data.text.split(separator)

        console.log(`Encontrados ${examTexts.length} seções de exames no arquivo ${file.name}`)

        // Processar cada exame encontrado individualmente
        for (let i = 0; i < examTexts.length; i++) {
          const examText = examTexts[i].trim()

          // Pular seções vazias ou muito pequenas (provavelmente não são exames)
          if (!examText || examText.length < 50) continue

          console.log(`Processando exame ${i + 1}/${examTexts.length} do arquivo ${file.name}`)
          const examData = extractExamData(examText)

          // Identificar o tipo de exame para o nome
          const examType = identifyExamType(examText)
          const sequenceNumber = i + 1

          results.push({
            fileName: `${file.name.replace('.pdf', '')}_${examType || 'EXAME'}${sequenceNumber}`,
            ...examData,
            processedAt: new Date().toISOString()
          })

          console.log(`Exame ${i + 1}/${examTexts.length} do arquivo ${file.name} processado com sucesso`)
        }

        console.log(`Arquivo ${file.name} processado com sucesso`)
      } catch (fileError) {
        console.error(`Erro detalhado ao processar arquivo ${file.name}:`, fileError)
        results.push({
          fileName: file.name,
          error: fileError instanceof Error ?
            `${fileError.name}: ${fileError.message}` :
            'Erro desconhecido ao processar arquivo',
          textoCompleto: '',
          processedAt: new Date().toISOString()
        })
      }
    }

    console.log(`Processamento concluído. ${results.length} resultado(s)`)
    global.examResults = results

    // Salvar resultados em um arquivo JSON em uma pasta privada
    try {
      // Usar pasta data dentro do projeto, mas fora da pasta public
      const dataDir = path.join(process.cwd(), 'data')

      // Criar pasta data se não existir
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      // Criptografar e remover informações sensíveis antes de salvar
      const sanitizedResults = results.map(result => {
        // Criar uma cópia do resultado sem o texto completo
        const { textoCompleto, ...sanitizedResult } = result;

        // Criptografar o texto completo se existir
        const encryptedText = textoCompleto ? encryptData(textoCompleto) : '';

        // Manter apenas os primeiros 100 caracteres do texto para referência
        return {
          ...sanitizedResult,
          textoCompleto: encryptedText, // Armazenar versão criptografada
          textoResumido: textoCompleto ? textoCompleto.substring(0, 100) + '...' : ''
        };
      });

      const resultsPath = path.join(dataDir, 'exam-results.json')
      fs.writeFileSync(resultsPath, JSON.stringify(sanitizedResults, null, 2))
      console.log(`Resultados salvos em: ${resultsPath}`)

      // Criar uma cópia na pasta public apenas com dados não sensíveis para acesso do cliente
      const publicDir = path.join(process.cwd(), 'public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }

      // Versão pública contém apenas os valores numéricos e metadados, sem textos completos
      const publicResults = sanitizedResults.map(result => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { textoResumido, rawText, ...publicData } = result;
        return publicData;
      });

      const publicResultsPath = path.join(publicDir, 'exam-results.json')
      fs.writeFileSync(publicResultsPath, JSON.stringify(publicResults, null, 2))
    } catch (fsError) {
      console.error('Erro ao salvar arquivo de resultados:', fsError)
      // Não falhar por causa do arquivo, apenas logar o erro
    }

    const response = {
      success: true,
      results,
      message: `${results.length} resultado(s) processado(s) com sucesso`
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

    // Não expor detalhes de erro ou stack traces na resposta
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar arquivos',
        details: 'Ocorreu um erro interno ao processar sua solicitação'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Função para identificar o tipo de exame com base no texto
function identifyExamType(text: string): string {
  // Procurar por nomes comuns de exames no início das seções
  const examPatterns = [
    { pattern: /hemograma/i, name: 'HEMOGRAMA' },
    { pattern: /colesterol/i, name: 'COLESTEROL' },
    { pattern: /glicose/i, name: 'GLICOSE' },
    { pattern: /triglicer[ií]deo/i, name: 'TRIGLICERIDEOS' },
    { pattern: /hdl/i, name: 'HDL' },
    { pattern: /ldl/i, name: 'LDL' },
    { pattern: /vldl/i, name: 'VLDL' },
    { pattern: /plaquetas/i, name: 'PLAQUETAS' },
    { pattern: /leuc[óo]citos/i, name: 'LEUCOCITOS' },
    { pattern: /vhs/i, name: 'VHS' },
    { pattern: /tgo/i, name: 'TGO' },
    { pattern: /tgp/i, name: 'TGP' },
    { pattern: /creatinina/i, name: 'CREATININA' },
    { pattern: /ur[eé]ia/i, name: 'UREIA' },
    { pattern: /[áa]cido\s*[úu]rico/i, name: 'ACIDOURICO' },
    { pattern: /vitamina\s*d/i, name: 'VITAMINAD' },
    { pattern: /vitamina\s*b12/i, name: 'VITAMINAB12' },
    { pattern: /tsh/i, name: 'TSH' },
    { pattern: /t4/i, name: 'T4' },
    { pattern: /hbsag/i, name: 'HBSAG' },
    { pattern: /anti\s*hcv/i, name: 'ANTIHCV' },
    { pattern: /vdrl/i, name: 'VDRL' },
    { pattern: /hbe/i, name: 'HBE' },
    { pattern: /hbc/i, name: 'HBC' },
    { pattern: /25-hidroxivitamina/i, name: 'VITAMINA_D' },
    { pattern: /fosfatase/i, name: 'FOSFATASE' },
    { pattern: /ggt/i, name: 'GGT' },
    { pattern: /ferritina/i, name: 'FERRITINA' },
  ]

  // Procurar as primeiras linhas para identificar o tipo de exame
  const firstLines = text.split('\n').slice(0, 10).join(' ')

  for (const { pattern, name } of examPatterns) {
    if (pattern.test(firstLines)) {
      return name
    }
  }

  return ''
}

function extractExamData(text: string): Omit<ExamResult, 'fileName' | 'processedAt'> {
  console.log('Iniciando extração de dados do texto...')

  const extractNumber = (match: RegExpMatchArray | null): number | null => {
    if (!match || !match[1]) return null

    // Remover possíveis caracteres não numéricos (exceto vírgula e ponto)
    const valueStr = match[1].replace(/[^\d,.]/g, '').replace(',', '.').trim()

    // Tratamento especial para números que têm separador de milhar
    let value = valueStr
    if (valueStr.includes('.') && valueStr.split('.').length > 2) {
      // Caso seja um número com separador de milhar (ex: 220.000)
      value = valueStr.replace(/\./g, '')
    }

    const parsed = parseFloat(value)
    console.log(`Extraindo número: "${valueStr}" => ${isNaN(parsed) ? 'NaN' : parsed}`)
    return isNaN(parsed) ? null : parsed
  }

  // Padrões para diferentes formatações de exames
  // Adiciona múltiplos padrões para o mesmo tipo de exame para lidar com diferentes layouts
  const patternGroups = {
    hemoglobina: [
      /Hemoglobina[:\s.]+(\d+[.,]?\d*)/i,
      /Hemoglobina[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /Hb[:\s.]+(\d+[.,]?\d*)/i
    ],
    glicose: [
      /Glicose[:\s.]+(\d+[.,]?\d*)/i,
      /Glicose de jejum[:\s.]+(\d+[.,]?\d*)/i,
      /Glicemia[:\s.]+(\d+[.,]?\d*)/i
    ],
    colesterolTotal: [
      /Colesterol\s+Total[:\s.]+(\d+[.,]?\d*)/i,
      /Colesterol[\s\-]*total[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /CT[:\s.]+(\d+[.,]?\d*)/i
    ],
    triglicerides: [
      /Triglicer[íi]deos?[:\s.]+(\d+[.,]?\d*)/i,
      /Triglicer[íi]deos?[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /TG[:\s.]+(\d+[.,]?\d*)/i
    ],
    hdl: [
      /HDL[:\s.-]+(\d+[.,]?\d*)/i,
      /HDL[\s\-]*(?:colesterol)?[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /Colesterol HDL[:\s.]+(\d+[.,]?\d*)/i
    ],
    ldl: [
      /LDL[:\s.-]+(\d+[.,]?\d*)/i,
      /LDL[\s\-]*(?:colesterol)?[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /Colesterol LDL[:\s.]+(\d+[.,]?\d*)/i
    ],
    vldl: [
      /VLDL[:\s.-]+(\d+[.,]?\d*)/i,
      /VLDL[\s\-]*(?:colesterol)?[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /Colesterol VLDL[:\s.]+(\d+[.,]?\d*)/i
    ],
    plaquetas: [
      /Plaquetas[:\s.]+(\d+\.?\d*)/i,
      /Plaquetas[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+\.?\d*)/i,
      /Contagem de plaquetas[:\s.]+(\d+\.?\d*)/i
    ],
    leucocitos: [
      /Leuc[óo]citos[:\s.]+(\d+[.,]?\d*)/i,
      /Leuc[óo]citos[\s\-]*(?:totais)?[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /Glóbulos brancos[:\s.]+(\d+[.,]?\d*)/i
    ],
    hematocrito: [
      /Hemat[óo]crito[:\s.]+(\d+[.,]?\d*)/i,
      /Hemat[óo]crito[\s\-]*(?:[\(\)a-zA-Z\s]*)?[:;=\s]+(\d+[.,]?\d*)/i,
      /Ht[:\s.]+(\d+[.,]?\d*)/i
    ],
    vcm: [
      /[V]\.?[C]\.?[M]\.?[:\s.]+(\d+[.,]?\d*)/i,
      /Volume[s]?\s+corpuscular[es]?\s+m[ée]dio[s]?[:\s.]+(\d+[.,]?\d*)/i
    ],
    hcm: [
      /[H]\.?[C]\.?[M]\.?[:\s.]+(\d+[.,]?\d*)/i,
      /Hemoglobina\s+corpuscular\s+m[ée]dia[:\s.]+(\d+[.,]?\d*)/i
    ],
    chcm: [
      /[C]\.?[H]\.?[C]\.?[M]\.?[:\s.]+(\d+[.,]?\d*)/i,
      /Concentra[çc][ãa]o\s+de\s+hemoglobina\s+corpuscular\s+m[ée]dia[:\s.]+(\d+[.,]?\d*)/i
    ],
    rdw: [
      /[R]\.?[D]\.?[W]\.?[:\s.-]+(\d+[.,]?\d*)/i,
      /Amplitude\s+de\s+distribui[çc][ãa]o\s+dos\s+glóbulos\s+vermelhos[:\s.]+(\d+[.,]?\d*)/i
    ],
    tgo: [
      /TGO[:\s.]+(\d+[.,]?\d*)/i,
      /AST[:\s.]+(\d+[.,]?\d*)/i,
      /Transaminase\s+oxalac[ée]tica[:\s.]+(\d+[.,]?\d*)/i,
      /Aspartato\s+aminotransferase[:\s.]+(\d+[.,]?\d*)/i
    ],
    tgp: [
      /TGP[:\s.]+(\d+[.,]?\d*)/i,
      /ALT[:\s.]+(\d+[.,]?\d*)/i,
      /Transaminase\s+pir[úu]vica[:\s.]+(\d+[.,]?\d*)/i,
      /Alanina\s+aminotransferase[:\s.]+(\d+[.,]?\d*)/i
    ],
    creatinina: [
      /Creatinina[:\s.]+(\d+[.,]?\d*)/i,
      /Creatinina\s+sérica[:\s.]+(\d+[.,]?\d*)/i
    ],
    ureia: [
      /Ur[eé]ia[:\s.]+(\d+[.,]?\d*)/i,
      /Nitrog[êe]nio\s+ur[ée]ico[:\s.]+(\d+[.,]?\d*)/i,
      /BUN[:\s.]+(\d+[.,]?\d*)/i
    ],
    acidoUrico: [
      /[ÁA]cido\s*[ÚU]rico[:\s.]+(\d+[.,]?\d*)/i,
      /[ÁA]cido\s*[ÚU]rico\s*s[ée]rico[:\s.]+(\d+[.,]?\d*)/i
    ],
    vhs: [
      /VHS[:\s.]+(\d+[.,]?\d*)/i,
      /Velocidade\s+de\s+hemossedimenta[çc][aã]o[:\s.]+(\d+[.,]?\d*)/i,
      /VSG[:\s.]+(\d+[.,]?\d*)/i
    ],
    // Células sanguíneas
    segmentados: [
      /Segmentados[:\s.]+(\d+[.,]?\d*)\s*\%/i,
      /Neutr[óo]filos\s+segmentados[:\s.]+(\d+[.,]?\d*)\s*\%/i
    ],
    eosinofilos: [
      /Eosin[óo]filos[:\s.]+(\d+[.,]?\d*)\s*\%/i
    ],
    basofilos: [
      /Bas[óo]filos[:\s.]+(\d+[.,]?\d*)\s*\%/i
    ],
    linfocitos: [
      /Linf[óo]citos[:\s.]+(\d+[.,]?\d*)\s*\%/i
    ],
    monocitos: [
      /Mon[óo]citos[:\s.]+(\d+[.,]?\d*)\s*\%/i
    ],
    // Outros exames
    vpm: [
      /VPM[:\s.]+(\d+[.,]?\d*)/i,
      /Volume\s+plaquet[áa]rio\s+m[ée]dio[:\s.]+(\d+[.,]?\d*)/i
    ],
    fosfatase: [
      /Fosfatase\s+alcalina[:\s.]+(\d+[.,]?\d*)/i,
      /FA[:\s.]+(\d+[.,]?\d*)/i
    ],
    ggt: [
      /GGT[:\s.]+(\d+[.,]?\d*)/i,
      /Gama\s*GT[:\s.]+(\d+[.,]?\d*)/i,
      /Gama\s*glutamil\s*transferase[:\s.]+(\d+[.,]?\d*)/i
    ],
    ferritina: [
      /Ferritina[:\s.]+(\d+[.,]?\d*)/i
    ],
    ferro: [
      /Ferro\s*s[ée]rico[:\s.]+(\d+[.,]?\d*)/i,
      /Ferro[:\s.]+(\d+[.,]?\d*)/i
    ],
    transferrina: [
      /Transferrina[:\s.]+(\d+[.,]?\d*)/i
    ],
    pcr: [
      /PCR[:\s.]+(\d+[.,]?\d*)/i,
      /Prote[íi]na\s*C\s*reativa[:\s.]+(\d+[.,]?\d*)/i
    ],
    sodio: [
      /S[óo]dio[:\s.]+(\d+[.,]?\d*)/i,
      /Na\+?[:\s.]+(\d+[.,]?\d*)/i
    ],
    potassio: [
      /Pot[áa]ssio[:\s.]+(\d+[.,]?\d*)/i,
      /K\+?[:\s.]+(\d+[.,]?\d*)/i
    ],
    magnesio: [
      /Magn[ée]sio[:\s.]+(\d+[.,]?\d*)/i,
      /Mg\+?[:\s.]+(\d+[.,]?\d*)/i
    ],
    calcio: [
      /C[áa]lcio[:\s.]+(\d+[.,]?\d*)/i,
      /Ca\+?[:\s.]+(\d+[.,]?\d*)/i
    ],
    fosforo: [
      /F[óo]sforo[:\s.]+(\d+[.,]?\d*)/i,
      /P[:\s.]+(\d+[.,]?\d*)/i
    ],
    bilirubinaTotal: [
      /Bilirrubina\s*total[:\s.]+(\d+[.,]?\d*)/i,
      /BT[:\s.]+(\d+[.,]?\d*)/i
    ],
    bilirubinaIndireta: [
      /Bilirrubina\s*indireta[:\s.]+(\d+[.,]?\d*)/i,
      /BI[:\s.]+(\d+[.,]?\d*)/i
    ],
    bilirubinaDisponivel: [
      /Bilirrubina\s*direta[:\s.]+(\d+[.,]?\d*)/i,
      /BD[:\s.]+(\d+[.,]?\d*)/i
    ],
    glicoseJejum: [
      /Glicose\s*(?:\(?jejum\)?)[:\s.]+(\d+[.,]?\d*)/i,
      /Glicemia\s*(?:\(?jejum\)?)[:\s.]+(\d+[.,]?\d*)/i
    ],
    hemoglobinaGlicosilada: [
      /Hemoglobina\s*glicos[ií]?lada[:\s.]+(\d+[.,]?\d*)/i,
      /HbA1c[:\s.]+(\d+[.,]?\d*)/i,
      /A1C[:\s.]+(\d+[.,]?\d*)/i
    ],
    insulina: [
      /Insulina[:\s.]+(\d+[.,]?\d*)/i
    ],
    albumina: [
      /Albumina[:\s.]+(\d+[.,]?\d*)/i
    ],
    vitaminaD: [
      /Vitamina\s*D[:\s.]+(\d+[.,]?\d*)/i,
      /25-OH-vitamina\s*D[:\s.]+(\d+[.,]?\d*)/i,
      /25\(?OH\)?\s*vitamina\s*D[:\s.]+(\d+[.,]?\d*)/i
    ],
    vitaminaB12: [
      /Vitamina\s*B12[:\s.]+(\d+[.,]?\d*)/i,
      /Cianocobalamina[:\s.]+(\d+[.,]?\d*)/i
    ],
    tsh: [
      /TSH[:\s.]+(\d+[.,]?\d*)/i,
      /Horm[ôo]nio\s*estimulante\s*da\s*tire[óo]ide[:\s.]+(\d+[.,]?\d*)/i
    ],
    t4Livre: [
      /T4\s*livre[:\s.]+(\d+[.,]?\d*)/i,
      /Tiroxina\s*livre[:\s.]+(\d+[.,]?\d*)/i
    ],
    rgf: [
      /RFG[:\s.]+(\d+[.,]?\d*)/i,
      /Ritmo\s*de\s*filtra[çc][ãa]o\s*glomerular[:\s.]+(\d+[.,]?\d*)/i,
      /TFG[:\s.]+(\d+[.,]?\d*)/i,
      /Taxa\s*de\s*filtra[çc][ãa]o\s*glomerular[:\s.]+(\d+[.,]?\d*)/i,
      /ESTIMATIVA\s*DO\s*RITMO\s*DE\s*FILTRAÇÃO\s*GLOMERULAR[:\s.>\s]*(\d+[.,]?\d*)/i
    ],
    colesterolNaoHdl: [
      /Colesterol\s*n[ãa]o-HDL[:\s.]+(\d+[.,]?\d*)/i,
      /N[ãa]o-HDL[:\s.]+(\d+[.,]?\d*)/i
    ]
  }

  const results: Record<string, number | null> = {}

  // Extrair todos os padrões possíveis, percorrendo cada grupo
  for (const [key, patterns] of Object.entries(patternGroups)) {
    let value: number | null = null

    // Tenta cada padrão até encontrar um valor
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        value = extractNumber(match)
        if (value !== null) {
          break // Encontrou um valor, não precisa testar os outros padrões
        }
      }
    }

    results[key] = value
    console.log(`Resultado para ${key}:`, results[key])
  }

  // Procurar números em contexto
  // Isso é útil para quando os valores estão em tabelas ou formatados de maneira que as regexes acima não capturam

  // Procura por "plaquetas" seguido de números, mesmo que com texto entre eles
  if (!results.plaquetas) {
    const plaquetasMatch = text.match(/plaquetas.*?(\d{2,}\.?\d*)/i)
    if (plaquetasMatch) {
      results.plaquetas = extractNumber(plaquetasMatch)
    }
  }

  // Procura por Colesterol HDL em contextos diversos
  if (!results.hdl) {
    // Tenta encontrar o padrão "COLESTEROL HDL" seguido eventualmente por um número
    const hdlMatch = text.match(/COLESTEROL\s+HDL.*?(\d+[.,]?\d*)/i)
    if (hdlMatch) {
      results.hdl = extractNumber(hdlMatch)
    }
  }

  // Procura por Colesterol LDL em contextos diversos
  if (!results.ldl) {
    const ldlMatch = text.match(/COLESTEROL\s+LDL.*?(\d+[.,]?\d*)/i)
    if (ldlMatch) {
      results.ldl = extractNumber(ldlMatch)
    }
  }

  // Retornar os resultados com o texto completo do exame
  const output = {
    ...results,
    rawText: text.substring(0, 1000), // Mantido para compatibilidade
    textoCompleto: text // Armazenar o texto completo do PDF
  }

  console.log('Extração de dados concluída')
  return output
}