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
  leucocitos: { min: 4000, max: 11000, unit: '/mm³', description: 'Células de defesa do organismo' }
}

function getExamStatus(value: number | null | undefined, refMin: number, refMax: number): string {
  if (value === null || value === undefined) return 'Não disponível'
  if (value < refMin) return 'Abaixo do valor de referência'
  if (value > refMax) return 'Acima do valor de referência'
  return 'Dentro dos valores normais'
}

function getStatusColor(value: number | null | undefined, refMin: number, refMax: number): string {
  if (value === null || value === undefined) return 'text-gray-500'
  if (value < refMin) return 'text-amber-500'
  if (value > refMax) return 'text-red-500'
  return 'text-green-500'
}

export default function Dashboard() {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          setExamResults(data)
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
    { key: 'leucocitos', label: 'Leucócitos' }
  ]

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Dashboard de Resultados
      </h2>

      {/* Lista de exames com gráficos individuais */}
      <div className="space-y-10">
        {examTypes.map(examType => {
          const refValue = referenceValues[examType.key as keyof typeof referenceValues]
          if (!refValue) return null

          // Verificar se algum dos resultados tem esse tipo de exame
          const hasValues = examResults.some(result =>
            result[examType.key as keyof ExamResult] !== null &&
            result[examType.key as keyof ExamResult] !== undefined
          )

          if (!hasValues) return null

          // Dados para o gráfico
          const chartData = {
            labels: examResults
              .filter(result =>
                result[examType.key as keyof ExamResult] !== null &&
                result[examType.key as keyof ExamResult] !== undefined
              )
              .map(result => result.fileName),
            datasets: [
              {
                label: `${examType.label} (${refValue.unit})`,
                data: examResults
                  .filter(result =>
                    result[examType.key as keyof ExamResult] !== null &&
                    result[examType.key as keyof ExamResult] !== undefined
                  )
                  .map(result => result[examType.key as keyof ExamResult]),
                backgroundColor: examResults
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
                borderColor: examResults
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
                  afterLabel: function (context: any) {
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
                  color: (context: any) => {
                    if (context.tick.value === refValue.min || context.tick.value === refValue.max) {
                      return 'rgba(75, 192, 192, 0.5)'
                    }
                    return 'rgba(0, 0, 0, 0.1)'
                  },
                  lineWidth: (context: any) => {
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
                  {examResults
                    .filter(result =>
                      result[examType.key as keyof ExamResult] !== null &&
                      result[examType.key as keyof ExamResult] !== undefined
                    )
                    .map((result, index) => {
                      const value = result[examType.key as keyof ExamResult] as number
                      const status = getExamStatus(value, refValue.min, refValue.max)
                      const statusColor = getStatusColor(value, refValue.min, refValue.max)

                      const medicalAnalysis = value < refValue.min
                        ? `Valor abaixo do padrão. Recomenda-se investigar causas de deficiência de ${examType.label.toLowerCase()}.`
                        : value > refValue.max
                          ? `Valor acima do padrão. Recomenda-se investigar causas de excesso de ${examType.label.toLowerCase()} e possíveis riscos associados.`
                          : `Valor dentro do padrão normal. Não requer intervenção específica para ${examType.label.toLowerCase()}.`

                      return (
                        <div key={index} className="p-3">
                          <p className="font-medium">{result.fileName}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span>Valor: {value} {refValue.unit}</span>
                            <span className={`font-medium ${statusColor}`}>{status}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{medicalAnalysis}</p>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resumo dos Resultados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examResults.map((result, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{result.fileName}</h4>
              <div className="mt-2 space-y-2">
                {Object.entries(result)
                  .filter(([key]) => key !== 'fileName' && key !== 'processedAt' && key !== 'rawText' && key !== 'error')
                  .map(([key, value]) => {
                    if (value === null || value === undefined) return null
                    const refValue = referenceValues[key as keyof typeof referenceValues]
                    if (!refValue) return null

                    const status = getExamStatus(value as number, refValue.min, refValue.max)
                    const statusColor = getStatusColor(value as number, refValue.min, refValue.max)

                    return (
                      <div key={key} className="flex justify-between">
                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}: {value} {refValue.unit}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${statusColor.replace('text', 'bg')}/20`}>
                          {status === 'Dentro dos valores normais' ? 'Normal' : status === 'Acima do valor de referência' ? 'Alto' : 'Baixo'}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 