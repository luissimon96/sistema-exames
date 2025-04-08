'use client'

import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'

// Registro dos componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  rawText?: string
  error?: string
  processedAt: string
  annotations?: Annotation[]
  medications?: Medication[]
}

interface Annotation {
  id: string
  date: string
  text: string
  examKey?: string
}

interface Medication {
  id: string
  name: string
  startDate: string
  endDate?: string
  dosage?: string
}

interface ReferenceValue {
  min: number
  max: number
  unit: string
}

// Valores de referência para os exames mais comuns
const referenceValues: Record<string, ReferenceValue> = {
  hemoglobina: { min: 12, max: 16, unit: 'g/dL' },
  glicose: { min: 70, max: 99, unit: 'mg/dL' },
  colesterolTotal: { min: 0, max: 190, unit: 'mg/dL' },
  hdl: { min: 40, max: 60, unit: 'mg/dL' },
  ldl: { min: 0, max: 130, unit: 'mg/dL' },
  vldl: { min: 0, max: 30, unit: 'mg/dL' },
  triglicerides: { min: 0, max: 150, unit: 'mg/dL' },
  plaquetas: { min: 150000, max: 450000, unit: '/mm³' },
  leucocitos: { min: 4000, max: 11000, unit: '/mm³' },
  creatinina: { min: 0.6, max: 1.2, unit: 'mg/dL' },
  ureia: { min: 10, max: 50, unit: 'mg/dL' },
  tgo: { min: 0, max: 40, unit: 'U/L' },
  tgp: { min: 0, max: 41, unit: 'U/L' },
  hematocrito: { min: 36, max: 48, unit: '%' },
  vhs: { min: 0, max: 20, unit: 'mm/h' },
  pcr: { min: 0, max: 1, unit: 'mg/dL' },
  ferritina: { min: 15, max: 150, unit: 'ng/mL' },
  ferro: { min: 50, max: 170, unit: 'µg/dL' },
  tsh: { min: 0.4, max: 4.0, unit: 'mUI/L' },
  t4Livre: { min: 0.8, max: 1.9, unit: 'ng/dL' },
  vitaminaD: { min: 30, max: 100, unit: 'ng/mL' },
  vitaminaB12: { min: 200, max: 900, unit: 'pg/mL' },
};

// Função para determinar o status do exame com base nos valores de referência
const getExamStatus = (value: number, min: number, max: number): string => {
  if (value < min) return 'Abaixo do valor de referência';
  if (value > max) return 'Acima do valor de referência';
  return 'Dentro dos valores normais';
};

// Função para obter cor baseada no status
const getValueColor = (value: number, min: number, max: number): string => {
  if (value < min) return 'text-amber-600';
  if (value > max) return 'text-red-600';
  return 'text-green-600';
};

// Função para extrair a data do exame a partir do texto completo
const extractExamDate = (examText?: string): string | null => {
  if (!examText) return null;

  // Array com diferentes padrões de data para procurar
  const datePatterns = [
    // Padrão comum "Data: DD/MM/YYYY"
    /Data\.*\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2})/i,

    // Padrão "Data da coleta: DD/MM/YYYY"
    /Data\s*da\s*coleta\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2})/i,

    // Padrão "Coleta em: DD/MM/YYYY"
    /Coleta\s*em\.*\s*:\s*.*\s*Data\.*\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2})/i,

    // Padrão com apenas data no formato brasileiro
    /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2})\b/
  ];

  // Tenta cada padrão na ordem
  for (const pattern of datePatterns) {
    const match = examText.match(pattern);
    if (match && match[1]) {
      // Se encontrar uma data, formata para DD/MM/YYYY
      const dateParts = match[1].split('/');
      if (dateParts.length === 3) {
        let year = dateParts[2];
        // Se for ano de 2 dígitos, converte para 4 dígitos
        if (year.length === 2) {
          // Assume que anos menores que 50 são do século 21, e maiores são do século 20
          year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        }
        return `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${year}`;
      }
      return match[1];
    }
  }

  return null;
}

export default function RawData() {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [comparisonExam, setComparisonExam] = useState<ExamResult | null>(null)
  const [showComparison, setShowComparison] = useState<boolean>(false)
  const [temporalView, setTemporalView] = useState<boolean>(false)
  const [temporalExamKey, setTemporalExamKey] = useState<string | null>(null)
  const [newAnnotation, setNewAnnotation] = useState<string>('')
  const [newMedication, setNewMedication] = useState<{ name: string, dosage: string, startDate: string }>({
    name: '',
    dosage: '',
    startDate: new Date().toISOString().split('T')[0]
  })
  const [showAnnotationForm, setShowAnnotationForm] = useState<boolean>(false)
  const [showMedicationForm, setShowMedicationForm] = useState<boolean>(false)
  const [isSimplifiedView, setIsSimplifiedView] = useState<boolean>(false)

  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        const response = await fetch('/exam-results.json')
        if (!response.ok) {
          throw new Error('Falha ao carregar resultados')
        }
        const data = await response.json()
        // Adicionando arrays vazios para anotações e medicações se não existirem
        const processedData = data.map((exam: ExamResult) => ({
          ...exam,
          annotations: exam.annotations || [],
          medications: exam.medications || []
        }))
        setExamResults(processedData)
        if (processedData.length > 0) {
          // Encontrar primeiro exame com valores reais (começando pelo primeiro)
          const examWithValues = processedData.find((exam: ExamResult) => {
            // Verificar se tem pelo menos um valor não-nulo
            return Object.entries(exam).some(([key, value]) => {
              return (
                key !== 'fileName' &&
                key !== 'processedAt' &&
                key !== 'rawText' &&
                key !== 'error' &&
                key !== 'textoCompleto' &&
                key !== 'annotations' &&
                key !== 'medications' &&
                value !== null &&
                value !== undefined
              )
            })
          }) || processedData[0]

          setSelectedExam(examWithValues)
        }
      } catch (err) {
        setError('Erro ao carregar dados: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchExamResults()
  }, [])

  const formatValue = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    // Para valores numéricos, formatar apropriadamente
    if (typeof value === 'number') {
      // Se o valor for inteiro, não mostrar casas decimais
      if (Number.isInteger(value)) {
        return value.toString();
      }
      // Se for decimal, limitar a 2 casas decimais
      return value.toFixed(2);
    }
    return String(value);
  };

  // Função para adicionar anotação
  const addAnnotation = async () => {
    if (!selectedExam || !newAnnotation.trim()) return;

    const newAnnotationObj = {
      id: uuidv4(),
      date: new Date().toISOString(),
      text: newAnnotation,
      examKey: temporalExamKey || undefined
    };

    try {
      // Neste exemplo, apenas atualizamos o estado local
      // Em um sistema real, enviaríamos para o backend
      const updatedExam = {
        ...selectedExam,
        annotations: [...(selectedExam.annotations || []), newAnnotationObj]
      };

      const updatedResults = examResults.map(exam =>
        exam.fileName === selectedExam.fileName ? updatedExam : exam
      );

      setExamResults(updatedResults);
      setSelectedExam(updatedExam);
      setNewAnnotation('');
      setShowAnnotationForm(false);
    } catch (err) {
      console.error('Erro ao adicionar anotação:', err);
    }
  };

  // Função para adicionar medicação
  const addMedication = async () => {
    if (!selectedExam || !newMedication.name.trim()) return;

    const newMedicationObj = {
      id: uuidv4(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      startDate: newMedication.startDate,
    };

    try {
      // Neste exemplo, apenas atualizamos o estado local
      const updatedExam = {
        ...selectedExam,
        medications: [...(selectedExam.medications || []), newMedicationObj]
      };

      const updatedResults = examResults.map(exam =>
        exam.fileName === selectedExam.fileName ? updatedExam : exam
      );

      setExamResults(updatedResults);
      setSelectedExam(updatedExam);
      setNewMedication({
        name: '',
        dosage: '',
        startDate: new Date().toISOString().split('T')[0]
      });
      setShowMedicationForm(false);
    } catch (err) {
      console.error('Erro ao adicionar medicação:', err);
    }
  };

  // Função para exportar dados para Excel
  const exportToExcel = () => {
    if (!selectedExam) return;

    // Criando um objeto que será convertido em Excel
    const worksheetData = Object.entries(selectedExam)
      .filter(([key]) =>
        key !== 'fileName' &&
        key !== 'processedAt' &&
        key !== 'rawText' &&
        key !== 'error' &&
        key !== 'textoCompleto' &&
        key !== 'annotations' &&
        key !== 'medications' &&
        selectedExam[key as keyof ExamResult] !== null &&
        selectedExam[key as keyof ExamResult] !== undefined
      )
      .map(([key, value]) => {
        const refValue = referenceValues[key as keyof typeof referenceValues];
        const status = refValue && typeof value === 'number' ?
          getExamStatus(value, refValue.min, refValue.max) : 'N/A';
        const unit = refValue?.unit || '';

        return {
          'Exame': key.charAt(0).toUpperCase() + key.slice(1),
          'Valor': value,
          'Unidade': unit,
          'Referência': refValue ? `${refValue.min} - ${refValue.max}` : 'N/A',
          'Status': status
        };
      });

    // Criando a planilha Excel
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");

    // Gerando o arquivo e fazendo download
    const fileName = `${selectedExam.fileName.replace(/\.[^/.]+$/, "")}_resultados.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Função para calcular valores suavizados (LOWESS simplificado)
  const calculateSmoothedData = (data: { x: number, y: number }[], windowSize = 3) => {
    if (data.length <= windowSize) return data; // Retorna os dados originais se houver poucos pontos

    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;

      // Calculando a média dos pontos na janela
      for (let j = Math.max(0, i - Math.floor(windowSize / 2));
        j <= Math.min(data.length - 1, i + Math.floor(windowSize / 2));
        j++) {
        sum += data[j].y;
        count++;
      }

      smoothed.push({
        x: data[i].x,
        y: sum / count
      });
    }

    return smoothed;
  };

  // Gerar dados para visualização temporal
  const generateTemporalChartData = (examKey: string) => {
    if (!examKey) return null;

    // Coletando todos os valores disponíveis para o exame específico
    const dataPoints = examResults
      .filter(exam => exam[examKey as keyof ExamResult] !== null && exam[examKey as keyof ExamResult] !== undefined)
      .map((exam, index) => ({
        x: index, // Usamos o índice como x para simplicidade
        y: exam[examKey as keyof ExamResult] as number,
        date: new Date(exam.processedAt).toLocaleDateString(),
        fileName: exam.fileName
      }))
      .sort((a, b) => a.x - b.x); // Ordenando por índice

    if (dataPoints.length === 0) return null;

    // Calculando dados suavizados
    const smoothedData = calculateSmoothedData(dataPoints);

    // Obtendo valores de referência
    const refValue = referenceValues[examKey as keyof typeof referenceValues];

    return {
      labels: dataPoints.map(point => point.date),
      datasets: [
        {
          label: 'Valores Originais',
          data: dataPoints.map(point => point.y),
          borderColor: 'rgba(53, 162, 235, 0.8)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          pointRadius: 5,
          tension: 0.1
        },
        {
          label: 'Linha de Tendência (Suavizada)',
          data: smoothedData.map(point => point.y),
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          tension: 0.4
        },
        ...(refValue ? [
          {
            label: 'Valor Máximo de Referência',
            data: Array(dataPoints.length).fill(refValue.max),
            borderColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Valor Mínimo de Referência',
            data: Array(dataPoints.length).fill(refValue.min),
            borderColor: 'rgba(255, 159, 64, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: 1,
            backgroundColor: 'rgba(146, 240, 161, 0.2)',
            pointRadius: 0
          }
        ] : [])
      ]
    };
  };

  // Função para alternar para visualização temporal
  const toggleTemporalView = (examKey: string) => {
    setTemporalExamKey(examKey);
    setTemporalView(true);
  };

  // Função para exportar para PDF
  const exportToPDF = () => {
    // Na implementação real, utilizaríamos uma biblioteca como jsPDF
    // Por simplicidade, apenas simulamos essa funcionalidade
    alert('Funcionalidade de exportação para PDF será implementada em breve.');
  };

  // Função para compartilhar resultados
  const shareResults = () => {
    // Na implementação real, isso abriria um modal para compartilhar
    // Por simplicidade, apenas simulamos essa funcionalidade
    alert('Funcionalidade de compartilhamento será implementada em breve.');
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 border-b pb-2">Dados Brutos dos Exames</h1>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsSimplifiedView(!isSimplifiedView)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
          >
            {isSimplifiedView ? 'Visão Detalhada' : 'Visão Simplificada'}
          </button>

          {selectedExam && (
            <>
              <button
                onClick={exportToExcel}
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
              >
                Exportar Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
              >
                Exportar PDF
              </button>
              <button
                onClick={shareResults}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium"
              >
                Compartilhar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="examSelect" className="block mb-2 text-base font-medium text-gray-800">Selecione um Exame:</label>
        <div className="flex space-x-2">
          <select
            id="examSelect"
            className="border border-gray-300 rounded p-3 flex-grow bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedExam?.fileName || ''}
            onChange={(e) => {
              const selected = examResults.find(exam => exam.fileName === e.target.value)
              if (selected) setSelectedExam(selected)
            }}
            title="Selecione um exame para visualizar"
            aria-label="Selecione um exame para visualizar"
          >
            {examResults.map((exam) => {
              const examDate = extractExamDate(exam.textoCompleto || exam.rawText);
              return (
                <option key={exam.fileName} value={exam.fileName}>
                  {exam.fileName}{examDate ? ` (${examDate})` : ''} - Processado: {new Date(exam.processedAt).toLocaleString()}
                </option>
              );
            })}
          </select>

          {showComparison && (
            <select
              id="comparisonSelect"
              className="border border-gray-300 rounded p-3 flex-grow bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={comparisonExam?.fileName || ''}
              onChange={(e) => {
                const selected = examResults.find(exam => exam.fileName === e.target.value)
                if (selected) setComparisonExam(selected)
              }}
              title="Selecione um exame para comparar"
              aria-label="Selecione um exame para comparar"
            >
              <option value="">Selecione para comparar</option>
              {examResults
                .filter(exam => exam.fileName !== selectedExam?.fileName)
                .map((exam) => {
                  const examDate = extractExamDate(exam.textoCompleto || exam.rawText);
                  return (
                    <option key={exam.fileName} value={exam.fileName}>
                      {exam.fileName}{examDate ? ` (${examDate})` : ''} - Processado: {new Date(exam.processedAt).toLocaleString()}
                    </option>
                  );
                })}
            </select>
          )}

          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium whitespace-nowrap"
          >
            {showComparison ? 'Cancelar Comparação' : 'Comparar Exames'}
          </button>
        </div>
      </div>

      {temporalView && temporalExamKey ? (
        <div className="mt-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Evolução Temporal: {temporalExamKey.charAt(0).toUpperCase() + temporalExamKey.slice(1)}
            </h2>
            <button
              onClick={() => setTemporalView(false)}
              className="text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              Voltar aos Detalhes
            </button>
          </div>

          <div className="mb-6 p-6 border rounded-lg bg-gray-50 h-[400px]">
            {generateTemporalChartData(temporalExamKey) ? (
              <Line
                data={generateTemporalChartData(temporalExamKey)!}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: `Evolução de ${temporalExamKey.charAt(0).toUpperCase() + temporalExamKey.slice(1)} ao longo do tempo`
                    }
                  },
                  scales: {
                    y: {
                      title: {
                        display: true,
                        text: referenceValues[temporalExamKey as keyof typeof referenceValues]?.unit || 'Valor'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Data'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Não há dados suficientes para gerar o gráfico</p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-800">Anotações</h3>
            <div className="space-y-2 mb-4">
              {selectedExam?.annotations
                ?.filter(annotation => !annotation.examKey || annotation.examKey === temporalExamKey)
                .map(annotation => (
                  <div key={annotation.id} className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">
                        {new Date(annotation.date).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-800">{annotation.text}</p>
                  </div>
                ))}

              {(!selectedExam?.annotations || selectedExam.annotations.length === 0) && (
                <p className="text-gray-500 text-sm">Nenhuma anotação registrada</p>
              )}
            </div>

            {showAnnotationForm ? (
              <div className="p-4 border border-gray-300 rounded bg-gray-50">
                <textarea
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                  placeholder="Digite sua anotação sobre este exame..."
                  rows={3}
                ></textarea>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAnnotationForm(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addAnnotation}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Adicionar Anotação
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAnnotationForm(true)}
                className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 text-sm"
              >
                + Adicionar Anotação
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {selectedExam && (
            <div className="mt-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Exame: {selectedExam.fileName}
                {extractExamDate(selectedExam.textoCompleto || selectedExam.rawText) && (
                  <span className="ml-2 text-lg font-normal">
                    (Data: {extractExamDate(selectedExam.textoCompleto || selectedExam.rawText)})
                  </span>
                )}
              </h2>
              <p className="mb-4 text-base text-gray-700">
                Processado em: {new Date(selectedExam.processedAt).toLocaleString()}
              </p>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2 text-gray-800">Linha do Tempo de Medicações</h3>
                <div className="space-y-2 mb-4">
                  {selectedExam?.medications?.length ? (
                    <div className="relative p-4 border border-gray-200 rounded bg-gray-50">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                      {selectedExam.medications.map((med) => (
                        <div key={med.id} className="relative mb-6 ml-9 last:mb-0">
                          <div className="absolute -left-9 mt-1.5">
                            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                          </div>
                          <div className="p-3 bg-white border border-gray-200 rounded shadow-sm">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-blue-700">{med.name}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(med.startDate).toLocaleDateString()}
                                {med.endDate ? ` até ${new Date(med.endDate).toLocaleDateString()}` : ' (atual)'}
                              </span>
                            </div>
                            {med.dosage && <p className="text-sm text-gray-600 mt-1">Dosagem: {med.dosage}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma medicação registrada</p>
                  )}
                </div>

                {showMedicationForm ? (
                  <div className="p-4 border border-gray-300 rounded bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Medicação</label>
                        <input
                          type="text"
                          value={newMedication.name}
                          onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="Ex: Losartana"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem</label>
                        <input
                          type="text"
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="Ex: 50mg 1x ao dia"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                        <input
                          type="date"
                          value={newMedication.startDate}
                          onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                          title="Data de início da medicação"
                          aria-label="Data de início da medicação"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowMedicationForm(false)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addMedication}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Adicionar Medicação
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMedicationForm(true)}
                    className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 text-sm"
                  >
                    + Adicionar Medicação
                  </button>
                )}
              </div>

              <div className="mb-8 p-6 border rounded-lg bg-gray-50 shadow-sm">
                <h3 className="text-lg font-medium mb-4 text-gray-900 border-b pb-2">Resultados por Categorias</h3>

                {Object.entries(examCategories).map(([category, examItems]) => {
                  // Verifica se há pelo menos um valor definido nesta categoria
                  const hasValue = examItems.some(item => {
                    const value = selectedExam[item.key as keyof ExamResult];
                    return value !== null && value !== undefined;
                  });

                  if (!hasValue && isSimplifiedView) return null;

                  return (
                    <div key={category} className="mb-6">
                      <h4 className="font-medium mb-3 pb-1 text-gray-800 border-b border-gray-300">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {examItems.map(item => {
                          const value = selectedExam[item.key as keyof ExamResult];
                          if ((value === null || value === undefined) && isSimplifiedView) return null;

                          const refValue = referenceValues[item.key as keyof typeof referenceValues];
                          const valueClass = typeof value === 'number' && refValue
                            ? getValueColor(value, refValue.min, refValue.max)
                            : 'text-gray-900';

                          return (
                            <div key={item.key} className="p-3 bg-white border border-gray-200 rounded shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-800">{item.label}:</span>
                                <button
                                  onClick={() => toggleTemporalView(item.key)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Ver evolução
                                </button>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <div>
                                  <span className={`font-medium ${typeof value === 'number' && refValue ? valueClass : value === null || value === undefined ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                                    {typeof value === 'number' || typeof value === 'string'
                                      ? formatValue(value)
                                      : Array.isArray(value)
                                        ? `${value.length} itens`
                                        : 'N/A'}
                                  </span>
                                  {refValue && typeof value === 'number' && (
                                    <span className="text-xs ml-1 text-gray-500">
                                      {refValue.unit}
                                      <span className="ml-1">
                                        (Ref: {refValue.min}-{refValue.max})
                                      </span>
                                    </span>
                                  )}
                                </div>
                                {refValue && typeof value === 'number' && (
                                  <span className={`text-xs font-medium px-2 py-1 rounded ${valueClass.replace('text', 'bg')}/30`}>
                                    {getExamStatus(value, refValue.min, refValue.max) === 'Dentro dos valores normais'
                                      ? <span className="text-green-600">Normal</span>
                                      : getExamStatus(value, refValue.min, refValue.max) === 'Acima do valor de referência'
                                        ? <span className="text-red-600">Alto</span>
                                        : <span className="text-amber-600">Baixo</span>}
                                  </span>
                                )}
                              </div>
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
                  <h3 className="text-lg font-medium mb-4 text-gray-900 border-b pb-2">
                    Texto Completo do Exame
                    <span className="ml-2 text-sm text-gray-500">
                      ({selectedExam.fileName})
                    </span>
                  </h3>
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
      )}
    </div>
  );
} 