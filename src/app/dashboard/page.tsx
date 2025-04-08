'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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
  rgf?: number | null
  colesterolNaoHdl?: number | null
  textoCompleto?: string
  processedAt: string
}

// Valores de referência para exames comuns
const referenceValues = {
  hemoglobina: { min: 12, max: 16, unit: 'g/dL', description: 'Essencial para transportar oxigênio pelo corpo' },
  glicose: { min: 70, max: 99, unit: 'mg/dL', description: 'Fonte de energia para o corpo' },
  colesterolTotal: { min: 0, max: 200, unit: 'mg/dL', description: 'Níveis elevados aumentam o risco cardiovascular' },
  triglicerides: { min: 0, max: 150, unit: 'mg/dL', description: 'Níveis elevados associados a risco cardiovascular' },
  hdl: { min: 40, max: 60, unit: 'mg/dL', description: 'Colesterol "bom", protege contra doenças cardiovasculares' },
  ldl: { min: 0, max: 100, unit: 'mg/dL', description: 'Colesterol "ruim", aumenta o risco cardiovascular' },
  vldl: { min: 0, max: 30, unit: 'mg/dL', description: 'Valores elevados associados a problemas cardiovasculares' },
  plaquetas: { min: 150000, max: 450000, unit: '/mm³', description: 'Essenciais para coagulação sanguínea' },
  leucocitos: { min: 4000, max: 11000, unit: '/mm³', description: 'Células de defesa do organismo' },
  vhs: { min: 0, max: 15, unit: 'mm/h', description: 'Velocidade de hemossedimentação, útil para avaliar inflamações' },
  tgo: { min: 17, max: 59, unit: 'U/L', description: 'Enzima hepática, indica saúde do fígado' },
  tgp: { min: 21, max: 72, unit: 'U/L', description: 'Enzima hepática, indica saúde do fígado' },
  hematocrito: { min: 40, max: 50, unit: '%', description: 'Percentual de células vermelhas no sangue' },
  vcm: { min: 83, max: 101, unit: 'fl', description: 'Volume corpuscular médio das hemácias' },
  hcm: { min: 27, max: 32, unit: 'pg', description: 'Hemoglobina corpuscular média' },
  chcm: { min: 31.5, max: 34.5, unit: '%', description: 'Concentração de hemoglobina corpuscular média' },
  rdw: { min: 11.5, max: 14.5, unit: '%', description: 'Variação do tamanho das hemácias' },
  creatinina: { min: 0.6, max: 1.2, unit: 'mg/dL', description: 'Resíduo metabólico, avalia função renal' },
  ureia: { min: 15, max: 45, unit: 'mg/dL', description: 'Produto da degradação de proteínas, avalia função renal' },
  acidoUrico: { min: 3.5, max: 7.2, unit: 'mg/dL', description: 'Produto do metabolismo das purinas' },
  segmentados: { min: 40, max: 80, unit: '%', description: 'Neutrófilos segmentados, principais células de defesa' },
  eosinofilos: { min: 1, max: 6, unit: '%', description: 'Células relacionadas a alergia e parasitoses' },
  basofilos: { min: 0, max: 3, unit: '%', description: 'Células associadas a processos inflamatórios' },
  linfocitos: { min: 20, max: 50, unit: '%', description: 'Células de defesa específica, imunidade' },
  monocitos: { min: 2, max: 10, unit: '%', description: 'Células de defesa que fagocitam patógenos' },
  vpm: { min: 9, max: 13, unit: 'fl', description: 'Volume plaquetário médio' },
  fosfatase: { min: 40, max: 130, unit: 'U/L', description: 'Enzima presente em vários tecidos, principalmente ossos e fígado' },
  ggt: { min: 8, max: 61, unit: 'U/L', description: 'Enzima hepática, sensível a alterações biliares' },
  ferritina: { min: 30, max: 400, unit: 'ng/mL', description: 'Reflete os estoques de ferro no organismo' },
  ferro: { min: 65, max: 175, unit: 'μg/dL', description: 'Mineral essencial para transporte de oxigênio' },
  transferrina: { min: 200, max: 360, unit: 'mg/dL', description: 'Proteína transportadora de ferro' },
  pcr: { min: 0, max: 0.5, unit: 'mg/dL', description: 'Proteína inflamatória aumentada em infecções e inflamações' },
  sodio: { min: 135, max: 145, unit: 'mEq/L', description: 'Eletrólito essencial para várias funções celulares' },
  potassio: { min: 3.5, max: 5.5, unit: 'mEq/L', description: 'Eletrólito vital para função cardíaca e muscular' },
  magnesio: { min: 1.8, max: 2.6, unit: 'mg/dL', description: 'Mineral essencial para mais de 300 reações enzimáticas' },
  calcio: { min: 8.5, max: 10.5, unit: 'mg/dL', description: 'Mineral essencial para ossos e função celular' },
  fosforo: { min: 2.5, max: 4.5, unit: 'mg/dL', description: 'Mineral essencial para ossos e metabolismo energético' },
  bilirubinaTotal: { min: 0.2, max: 1.2, unit: 'mg/dL', description: 'Produto da quebra da hemoglobina' },
  bilirubinaIndireta: { min: 0.1, max: 0.8, unit: 'mg/dL', description: 'Bilirrubina não conjugada no fígado' },
  bilirubinaDisponivel: { min: 0.1, max: 0.4, unit: 'mg/dL', description: 'Bilirrubina conjugada no fígado' },
  glicoseJejum: { min: 70, max: 99, unit: 'mg/dL', description: 'Nível de açúcar no sangue em jejum' },
  hemoglobinaGlicosilada: { min: 4, max: 5.6, unit: '%', description: 'Representa a média de glicose dos últimos 3 meses' },
  insulina: { min: 2.6, max: 24.9, unit: 'μU/mL', description: 'Hormônio que regula o açúcar no sangue' },
  albumina: { min: 3.5, max: 5.2, unit: 'g/dL', description: 'Proteína produzida pelo fígado, importante para várias funções' },
  vitaminaD: { min: 30, max: 100, unit: 'ng/mL', description: 'Vitamina essencial para ossos e sistema imunológico' },
  vitaminaB12: { min: 211, max: 946, unit: 'pg/mL', description: 'Vitamina essencial para função neural e produção de células sanguíneas' },
  tsh: { min: 0.4, max: 4.5, unit: 'mUI/L', description: 'Hormônio que estimula a tireoide' },
  t4Livre: { min: 0.8, max: 1.8, unit: 'ng/dL', description: 'Hormônio da tireoide em sua forma ativa' },
  rgf: { min: 90, max: 120, unit: 'mL/min/1.73m²', description: 'Medida da função renal' },
  colesterolNaoHdl: { min: 0, max: 160, unit: 'mg/dL', description: 'Colesterol total menos HDL, preditor de risco cardiovascular' }
}

function getExamStatus(value: number | null | undefined, refMin: number, refMax: number): string {
  if (value === null || value === undefined) return 'Não disponível'
  if (value < refMin) return 'Abaixo do valor de referência'
  if (value > refMax) return 'Acima do valor de referência'
  return 'Dentro dos valores normais'
}

function getValueColor(value: number | null | undefined, refMin: number, refMax: number): string {
  if (value === null || value === undefined) return 'text-gray-700'
  if (value < refMin) return 'text-amber-600'
  if (value > refMax) return 'text-red-600'
  return 'text-green-600'
}

export default function Dashboard() {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Agrupar exames por data de processamento
  const [groupByDate, setGroupByDate] = useState(false)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('Buscando resultados...')
        const response = await fetch('/exam-results.json')

        if (!response.ok) {
          console.error('Erro ao buscar resultados:', response.status, response.statusText)
          if (response.status === 404) {
            setError('Nenhum resultado encontrado. Por favor, processe alguns exames primeiro.')
          } else {
            setError(`Erro ao carregar resultados: ${response.status} ${response.statusText}`)
          }
          return
        }

        const text = await response.text()
        console.log('Resposta:', text.substring(0, 100) + '...')

        try {
          const data = JSON.parse(text)
          console.log('Dados carregados:', data)

          // Ordenar os exames por data de processamento (mais recente primeiro)
          const sortedData = data.sort((a: ExamResult, b: ExamResult) => {
            return new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
          })

          setExamResults(sortedData)
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta:', parseError)
          setError('Formato de resposta inválido')
        }
      } catch (error) {
        console.error('Erro ao carregar resultados:', error)
        setError('Erro ao carregar resultados dos exames')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  // Agrupar exames por data de processamento
  const getGroupedResults = () => {
    if (!groupByDate) return examResults

    // Extrair a data sem a hora
    const dateMap: Record<string, ExamResult[]> = {}

    examResults.forEach(exam => {
      const datePart = new Date(exam.processedAt).toLocaleDateString()
      if (!dateMap[datePart]) {
        dateMap[datePart] = []
      }
      dateMap[datePart].push(exam)
    })

    // Retornar apenas o exame mais recente de cada dia
    return Object.values(dateMap).map(group => group[0])
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            Erro ao carregar dados
          </h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Voltar para Upload
          </Link>
        </div>
      </div>
    )
  }

  if (examResults.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            Nenhum resultado encontrado
          </h2>
          <p className="mt-2 text-gray-600">Nenhum exame foi processado ainda.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Fazer Upload de Exames
          </Link>
        </div>
      </div>
    )
  }

  // Lista de exames disponíveis
  const examTypes = [
    { key: 'hemoglobina', label: 'Hemoglobina' },
    { key: 'colesterolTotal', label: 'Colesterol Total' },
    { key: 'triglicerides', label: 'Triglicerídeos' },
    { key: 'hdl', label: 'HDL' },
    { key: 'ldl', label: 'LDL' },
    { key: 'glicose', label: 'Glicose' },
    { key: 'plaquetas', label: 'Plaquetas' },
    { key: 'leucocitos', label: 'Leucócitos' },
    { key: 'vhs', label: 'VHS' },
    { key: 'tgo', label: 'TGO' },
    { key: 'tgp', label: 'TGP' },
    { key: 'hematocrito', label: 'Hematócrito' },
    { key: 'vcm', label: 'VCM' },
    { key: 'hcm', label: 'HCM' },
    { key: 'chcm', label: 'CHCM' },
    { key: 'rdw', label: 'RDW' },
    { key: 'creatinina', label: 'Creatinina' },
    { key: 'ureia', label: 'Ureia' },
    { key: 'acidoUrico', label: 'Ácido Úrico' },
    { key: 'segmentados', label: 'Segmentados' },
    { key: 'eosinofilos', label: 'Eosinófilos' },
    { key: 'basofilos', label: 'Basófilos' },
    { key: 'linfocitos', label: 'Linfócitos' },
    { key: 'monocitos', label: 'Monócitos' },
    { key: 'vpm', label: 'VPM' },
    { key: 'fosfatase', label: 'Fosfatase Alcalina' },
    { key: 'ggt', label: 'GGT' },
    { key: 'ferritina', label: 'Ferritina' },
    { key: 'ferro', label: 'Ferro' },
    { key: 'transferrina', label: 'Transferrina' },
    { key: 'pcr', label: 'PCR' },
    { key: 'sodio', label: 'Sódio' },
    { key: 'potassio', label: 'Potássio' },
    { key: 'magnesio', label: 'Magnésio' },
    { key: 'calcio', label: 'Cálcio' },
    { key: 'fosforo', label: 'Fósforo' },
    { key: 'bilirubinaTotal', label: 'Bilirrubina Total' },
    { key: 'bilirubinaIndireta', label: 'Bilirrubina Indireta' },
    { key: 'bilirubinaDisponivel', label: 'Bilirrubina Direta' },
    { key: 'glicoseJejum', label: 'Glicose em Jejum' },
    { key: 'hemoglobinaGlicosilada', label: 'Hemoglobina Glicosilada' },
    { key: 'insulina', label: 'Insulina' },
    { key: 'albumina', label: 'Albumina' },
    { key: 'vitaminaD', label: 'Vitamina D' },
    { key: 'vitaminaB12', label: 'Vitamina B12' },
    { key: 'tsh', label: 'TSH' },
    { key: 't4Livre', label: 'T4 Livre' },
    { key: 'rgf', label: 'Filtração Glomerular' },
    { key: 'colesterolNaoHdl', label: 'Colesterol Não-HDL' }
  ]

  const groupedResults = getGroupedResults()

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard de Resultados
        </h2>

        <div className="flex items-center mt-2 md:mt-0">
          <label htmlFor="groupByDate" className="mr-2 text-sm font-medium text-gray-700">
            Exibir apenas exames mais recentes de cada dia
          </label>
          <input
            type="checkbox"
            id="groupByDate"
            checked={groupByDate}
            onChange={(e) => setGroupByDate(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Informações sobre seus exames</h3>
        <p className="text-gray-700">
          Foram encontrados <span className="font-medium">{examResults.length}</span> resultados de exames.
          {groupByDate ? (
            <span> Mostrando <span className="font-medium">{groupedResults.length}</span> exames mais recentes (agrupados por data).</span>
          ) : (
            <span> Mostrando todos os resultados.</span>
          )}
        </p>
      </div>

      {/* Resumo dos Resultados - Movido para o topo */}
      <div className="mb-8 p-4 bg-white shadow rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resumo dos Resultados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedResults.map((result, index) => {
            const date = new Date(result.processedAt).toLocaleDateString()

            // Verificar se existem exames com valores para mostrar
            const hasExams = Object.entries(result)
              .filter(([key]) =>
                key !== 'fileName' &&
                key !== 'processedAt' &&
                key !== 'rawText' &&
                key !== 'error' &&
                key !== 'textoCompleto'
              )
              .some(([, value]) => value !== null && value !== undefined);

            if (!hasExams) return null;

            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{result.fileName}</h4>
                  <span className="text-xs text-gray-600">{date}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {Object.entries(result)
                    .filter(([key]) => key !== 'fileName' && key !== 'processedAt' && key !== 'rawText' && key !== 'error' && key !== 'textoCompleto')
                    .map(([key, value]) => {
                      if (value === null || value === undefined) return null
                      const refValue = referenceValues[key as keyof typeof referenceValues]
                      if (!refValue) return null

                      const status = getExamStatus(value as number, refValue.min, refValue.max)

                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-700">{key.charAt(0).toUpperCase() + key.slice(1)}: <span className={`font-medium ${getValueColor(value as number, refValue.min, refValue.max)}`}>{value}</span> {refValue.unit}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getValueColor(value as number, refValue.min, refValue.max).replace('text', 'bg')}/30`}>
                            {status === 'Dentro dos valores normais' ? <span className="text-green-600">Normal</span> : status === 'Acima do valor de referência' ? <span className="text-red-600">Alto</span> : <span className="text-amber-600">Baixo</span>}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de exames com gráficos individuais */}
      <div className="space-y-10">
        {examTypes.map(examType => {
          const refValue = referenceValues[examType.key as keyof typeof referenceValues]
          if (!refValue) return null

          // Verificar se algum dos resultados tem esse tipo de exame
          const hasValues = groupedResults.some(result =>
            result[examType.key as keyof ExamResult] !== null &&
            result[examType.key as keyof ExamResult] !== undefined
          )

          if (!hasValues) return null

          // Dados para o gráfico
          const chartData = {
            labels: groupedResults
              .filter(result =>
                result[examType.key as keyof ExamResult] !== null &&
                result[examType.key as keyof ExamResult] !== undefined
              )
              .map(result => {
                // Extrair apenas o nome principal do arquivo para o label
                const fileName = result.fileName
                const date = new Date(result.processedAt).toLocaleDateString()
                return `${fileName.split('_')[0]} (${date})`
              }),
            datasets: [
              {
                label: `${examType.label} (${refValue.unit})`,
                data: groupedResults
                  .filter(result =>
                    result[examType.key as keyof ExamResult] !== null &&
                    result[examType.key as keyof ExamResult] !== undefined
                  )
                  .map(result => result[examType.key as keyof ExamResult]),
                backgroundColor: groupedResults
                  .filter(result =>
                    result[examType.key as keyof ExamResult] !== null &&
                    result[examType.key as keyof ExamResult] !== undefined
                  )
                  .map(result => {
                    const value = result[examType.key as keyof ExamResult] as number
                    if (value < refValue.min) return 'rgba(251, 191, 36, 0.5)' // amber
                    if (value > refValue.max) return 'rgba(239, 68, 68, 0.5)' // red
                    return 'rgba(34, 197, 94, 0.5)' // green
                  }),
                borderColor: groupedResults
                  .filter(result =>
                    result[examType.key as keyof ExamResult] !== null &&
                    result[examType.key as keyof ExamResult] !== undefined
                  )
                  .map(result => {
                    const value = result[examType.key as keyof ExamResult] as number
                    if (value < refValue.min) return 'rgb(251, 191, 36)' // amber
                    if (value > refValue.max) return 'rgb(239, 68, 68)' // red
                    return 'rgb(34, 197, 94)' // green
                  }),
                borderWidth: 1,
              },
            ],
          }

          // Opções do gráfico
          const chartOptions = {
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: `${examType.label} - Valor de referência: ${refValue.min}-${refValue.max} ${refValue.unit}`,
              },
              tooltip: {
                callbacks: {
                  afterLabel: function (context: { parsed: { y: number | null | undefined } }) {
                    const value = context.parsed.y
                    if (value === null || value === undefined) return 'Valor não disponível'
                    if (value < refValue.min) return `Abaixo do valor de referência (${refValue.min}-${refValue.max} ${refValue.unit})`
                    if (value > refValue.max) return `Acima do valor de referência (${refValue.min}-${refValue.max} ${refValue.unit})`
                    return `Dentro do valor de referência (${refValue.min}-${refValue.max} ${refValue.unit})`
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: refValue.unit,
                },
                // Adicionar linhas para os valores de referência
                grid: {
                  color: (context: { tick: { value: number } }) => {
                    if (context.tick.value === refValue.min || context.tick.value === refValue.max) {
                      return 'rgba(75, 192, 192, 0.5)'
                    }
                    return 'rgba(0, 0, 0, 0.1)'
                  },
                  lineWidth: (context: { tick: { value: number } }) => {
                    if (context.tick.value === refValue.min || context.tick.value === refValue.max) {
                      return 2
                    }
                    return 1
                  },
                }
              }
            }
          }

          return (
            <div key={examType.key} className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{examType.label}</h3>
              <p className="text-gray-600 mb-4">{refValue.description}</p>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Valor de referência:</span> {refValue.min}-{refValue.max} {refValue.unit}
              </p>

              <div className="h-[40vh] mb-6">
                <Bar data={chartData} options={chartOptions} />
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Análise dos resultados:</h4>
                <div className="border rounded divide-y">
                  {groupedResults
                    .filter(result =>
                      result[examType.key as keyof ExamResult] !== null &&
                      result[examType.key as keyof ExamResult] !== undefined
                    )
                    .map((result, index) => {
                      const value = result[examType.key as keyof ExamResult] as number
                      const status = getExamStatus(value, refValue.min, refValue.max)
                      const statusColor = getValueColor(value, refValue.min, refValue.max)
                      const date = new Date(result.processedAt).toLocaleDateString()

                      const medicalAnalysis = value < refValue.min
                        ? `Valor abaixo do padrão. Recomenda-se investigar causas de deficiência de ${examType.label.toLowerCase()}.`
                        : value > refValue.max
                          ? `Valor acima do padrão. Recomenda-se investigar causas de excesso de ${examType.label.toLowerCase()} e possíveis riscos associados.`
                          : `Valor dentro do padrão normal. Não requer intervenção específica para ${examType.label.toLowerCase()}.`

                      return (
                        <div key={index} className="p-3">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-800">{result.fileName}</p>
                            <p className="text-sm text-gray-600">{date}</p>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-700">Valor: <span className={`font-medium ${getValueColor(value, refValue.min, refValue.max)}`}>{value}</span> {refValue.unit}</span>
                            <span className={`font-medium ${statusColor}`}>{status}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">{medicalAnalysis}</p>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 