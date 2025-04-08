'use client'

import React, { useState, useEffect } from 'react'

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
  rawText?: string
  error?: string
  processedAt: string
}

export default function RawData() {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        const response = await fetch('/exam-results.json')
        if (!response.ok) {
          throw new Error('Falha ao carregar resultados')
        }
        const data = await response.json()
        setExamResults(data)
        if (data.length > 0) {
          setSelectedExam(data[0])
        }
      } catch (err) {
        setError('Erro ao carregar dados: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchExamResults()
  }, [])

  const formatValue = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return value
  }

  // Agrupa os exames por categoria para melhor visualização
  const examCategories = {
    "Hemograma": [
      { label: "Hemoglobina", key: "hemoglobina" },
      { label: "Hematócrito", key: "hematocrito" },
      { label: "VCM", key: "vcm" },
      { label: "HCM", key: "hcm" },
      { label: "CHCM", key: "chcm" },
      { label: "RDW", key: "rdw" },
      { label: "Plaquetas", key: "plaquetas" },
      { label: "VPM", key: "vpm" },
      { label: "Leucócitos", key: "leucocitos" },
      { label: "Segmentados", key: "segmentados" },
      { label: "Eosinófilos", key: "eosinofilos" },
      { label: "Basófilos", key: "basofilos" },
      { label: "Linfócitos", key: "linfocitos" },
      { label: "Monócitos", key: "monocitos" },
    ],
    "Perfil Lipídico": [
      { label: "Colesterol Total", key: "colesterolTotal" },
      { label: "HDL", key: "hdl" },
      { label: "LDL", key: "ldl" },
      { label: "VLDL", key: "vldl" },
      { label: "Colesterol não-HDL", key: "colesterolNaoHdl" },
      { label: "Triglicérides", key: "triglicerides" },
    ],
    "Função Renal": [
      { label: "Creatinina", key: "creatinina" },
      { label: "Ureia", key: "ureia" },
      { label: "Ácido Úrico", key: "acidoUrico" },
      { label: "RFG", key: "rgf" },
    ],
    "Função Hepática": [
      { label: "TGO", key: "tgo" },
      { label: "TGP", key: "tgp" },
      { label: "Fosfatase Alcalina", key: "fosfatase" },
      { label: "GGT", key: "ggt" },
      { label: "Bilirrubina Total", key: "bilirubinaTotal" },
      { label: "Bilirrubina Indireta", key: "bilirubinaIndireta" },
      { label: "Bilirrubina Direta", key: "bilirubinaDisponivel" },
      { label: "Albumina", key: "albumina" },
    ],
    "Metabolismo": [
      { label: "Glicose", key: "glicose" },
      { label: "Glicose em Jejum", key: "glicoseJejum" },
      { label: "Hemoglobina Glicosilada", key: "hemoglobinaGlicosilada" },
      { label: "Insulina", key: "insulina" },
    ],
    "Minerais e Vitaminas": [
      { label: "Ferro", key: "ferro" },
      { label: "Ferritina", key: "ferritina" },
      { label: "Transferrina", key: "transferrina" },
      { label: "Sódio", key: "sodio" },
      { label: "Potássio", key: "potassio" },
      { label: "Magnésio", key: "magnesio" },
      { label: "Cálcio", key: "calcio" },
      { label: "Fósforo", key: "fosforo" },
      { label: "Vitamina D", key: "vitaminaD" },
      { label: "Vitamina B12", key: "vitaminaB12" },
    ],
    "Inflamação": [
      { label: "VHS", key: "vhs" },
      { label: "PCR", key: "pcr" },
    ],
    "Hormônios": [
      { label: "TSH", key: "tsh" },
      { label: "T4 Livre", key: "t4Livre" },
    ],
  }

  if (loading) return (
    <div className="container mx-auto p-6 bg-white shadow-sm rounded-lg">
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-700">Carregando dados...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container mx-auto p-6 bg-white shadow-sm rounded-lg">
      <div className="p-6 border border-red-300 bg-red-50 rounded-lg">
        <h3 className="text-xl font-medium mb-4 text-red-800 border-b border-red-200 pb-2">Erro ao Carregar Dados</h3>
        <p className="text-red-700 text-base">{error}</p>
      </div>
    </div>
  )

  if (examResults.length === 0) return (
    <div className="container mx-auto p-6 bg-white shadow-sm rounded-lg">
      <div className="p-6 border border-yellow-300 bg-yellow-50 rounded-lg">
        <h3 className="text-xl font-medium mb-4 text-yellow-800 border-b border-yellow-200 pb-2">Nenhum Resultado Encontrado</h3>
        <p className="text-yellow-700 text-base">Nenhum exame foi processado ainda. Faça o upload de exames primeiro.</p>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-4 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">Dados Brutos dos Exames</h1>

      <div className="mb-6">
        <label htmlFor="examSelect" className="block mb-2 text-base font-medium text-gray-800">Selecione um Exame:</label>
        <select
          id="examSelect"
          className="border border-gray-300 rounded p-3 w-full bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedExam?.fileName || ''}
          onChange={(e) => {
            const selected = examResults.find(exam => exam.fileName === e.target.value)
            if (selected) setSelectedExam(selected)
          }}
        >
          {examResults.map((exam) => (
            <option key={exam.fileName} value={exam.fileName}>
              {exam.fileName} - {new Date(exam.processedAt).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {selectedExam && (
        <div className="mt-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Exame: {selectedExam.fileName}
          </h2>
          <p className="mb-4 text-base text-gray-700">
            Processado em: {new Date(selectedExam.processedAt).toLocaleString()}
          </p>

          <div className="mb-8 p-6 border rounded-lg bg-gray-50 shadow-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-900 border-b pb-2">Resultados por Categorias</h3>

            {Object.entries(examCategories).map(([category, examItems]) => {
              // Verifica se há pelo menos um valor definido nesta categoria
              const hasValue = examItems.some(item =>
                selectedExam[item.key as keyof ExamResult] !== undefined &&
                selectedExam[item.key as keyof ExamResult] !== null
              );

              if (!hasValue) return null;

              return (
                <div key={category} className="mb-6">
                  <h4 className="font-medium mb-3 pb-1 text-gray-800 border-b border-gray-300">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {examItems.map(item => {
                      const value = selectedExam[item.key as keyof ExamResult];
                      if (value === undefined || value === null) return null;

                      return (
                        <div key={item.key} className="p-3 bg-white border border-gray-200 rounded shadow-sm">
                          <span className="font-medium text-gray-800">{item.label}:</span>{" "}
                          <span className="text-gray-900">{formatValue(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedExam.textoCompleto && (
            <div className="mt-6 p-6 border rounded-lg shadow-sm bg-white">
              <h3 className="text-lg font-medium mb-4 text-gray-900 border-b pb-2">Texto Completo do Exame</h3>
              <div className="whitespace-pre-wrap bg-gray-100 p-4 max-h-[500px] overflow-y-auto font-mono text-base leading-relaxed border border-gray-300 rounded text-gray-900">
                {selectedExam.textoCompleto}
              </div>
            </div>
          )}

          {selectedExam.error && (
            <div className="mt-6 p-6 border border-red-300 bg-red-50 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-3 text-red-800 border-b border-red-200 pb-2">Erro no Processamento</h3>
              <div className="text-red-700 text-base">{selectedExam.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 