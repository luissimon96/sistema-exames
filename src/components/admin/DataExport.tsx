'use client'

import { useState } from 'react'
import { CSVLink } from 'react-csv'
import ExcelJS from 'exceljs';

interface DataExportProps {
  onExport: (format: string, dataType: string, options: Record<string, unknown>) => Promise<unknown>
}

export default function DataExport({ onExport }: DataExportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState('csv')
  const [dataType, setDataType] = useState('users')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [includeFields, setIncludeFields] = useState({
    personalInfo: true,
    contactInfo: true,
    activityData: true,
    examData: false,
  })
  
  // Campos disponíveis para cada tipo de dados
  const dataTypeFields = {
    users: [
      { id: 'personalInfo', label: 'Informações Pessoais', description: 'Nome, email, função, data de criação' },
      { id: 'contactInfo', label: 'Informações de Contato', description: 'Telefone, localização, website' },
      { id: 'activityData', label: 'Dados de Atividade', description: 'Último login, contagem de logins, status' },
    ],
    exams: [
      { id: 'personalInfo', label: 'Informações Básicas', description: 'ID, nome do arquivo, data de processamento' },
      { id: 'examData', label: 'Dados do Exame', description: 'Texto resumido, anotações, medicações' },
    ],
    activities: [
      { id: 'personalInfo', label: 'Informações Básicas', description: 'ID, usuário, ação, data' },
      { id: 'activityData', label: 'Detalhes da Atividade', description: 'Detalhes, IP, user agent' },
    ],
  }
  
  // Função para lidar com a alteração de campos incluídos
  const handleFieldToggle = (fieldId: string) => {
    setIncludeFields({
      ...includeFields,
      [fieldId]: !includeFields[fieldId as keyof typeof includeFields],
    })
  }
  
  // Função para exportar dados
  const handleExport = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const options = {
        format: exportFormat,
        dateRange,
        includeFields,
      }
      
      const data = await onExport(exportFormat, dataType, options)
      
      if (exportFormat === 'excel') {
        // Export to Excel using exceljs
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(dataType);

        // Add headers dynamically based on data keys
        const headers = Object.keys(data[0] || {}).map((key) => ({ header: key, key }));
        worksheet.columns = headers;

        // Add data rows
        worksheet.addRows(data);

        // Generate the file and trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `${dataType}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      }
      
      setSuccess(`Dados exportados com sucesso no formato ${exportFormat.toUpperCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao exportar os dados')
      console.error('Erro ao exportar dados:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Preparar dados para CSV (simulado)
  const csvData = [
    ['ID', 'Nome', 'Email', 'Função', 'Data de Criação'],
    ['1', 'Administrador', 'admin@example.com', 'admin', '2023-01-01'],
    ['2', 'Usuário', 'user@example.com', 'user', '2023-01-02'],
  ]
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Exportação de Dados</h2>
      
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
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dataType" className="block text-sm font-medium text-gray-700">
              Tipo de Dados
            </label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="users">Usuários</option>
              <option value="exams">Exames</option>
              <option value="activities">Atividades</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="exportFormat" className="block text-sm font-medium text-gray-700">
              Formato de Exportação
            </label>
            <select
              id="exportFormat"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Data Inicial
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Data Final
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campos a Incluir
          </label>
          <div className="space-y-2">
            {dataType in dataTypeFields &&
              (dataTypeFields as Record<string, { id: string; label: string; description: string }[]>)[dataType].map((field: { id: string; label: string; description: string }) => (
                <div key={field.id} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={field.id}
                      type="checkbox"
                      checked={includeFields[field.id as keyof typeof includeFields] || false}
                      onChange={() => handleFieldToggle(field.id)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={field.id} className="font-medium text-gray-700">
                      {field.label}
                    </label>
                    <p className="text-gray-500">{field.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          {exportFormat === 'csv' ? (
            <CSVLink
              data={csvData}
              filename={`${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Exportando...' : 'Exportar Dados'}
            </CSVLink>
          ) : (
            <button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Exportando...' : 'Exportar Dados'}
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Observações sobre Exportação de Dados</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Certifique-se de que a exportação de dados está em conformidade com as leis de proteção de dados.</li>
          <li>Dados sensíveis devem ser tratados com cuidado e exportados apenas quando necessário.</li>
          <li>Recomenda-se filtrar os dados por data para exportações grandes.</li>
          <li>O formato Excel é recomendado para análises mais complexas.</li>
        </ul>
      </div>
    </div>
  )
}
