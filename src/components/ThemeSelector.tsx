'use client'

import { useState, useEffect } from 'react'
import { SketchPicker } from 'react-color'

interface ThemeSelectorProps {
  currentTheme: string
  currentAccentColor: string
  onThemeChange: (theme: string) => void
  onAccentColorChange: (color: string) => void
}

export default function ThemeSelector({
  currentTheme,
  currentAccentColor,
  onThemeChange,
  onAccentColorChange,
}: ThemeSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [accentColor, setAccentColor] = useState(currentAccentColor)
  
  // Atualizar o estado local quando as props mudam
  useEffect(() => {
    setAccentColor(currentAccentColor)
  }, [currentAccentColor])
  
  // Temas disponíveis
  const themes = [
    { id: 'light', name: 'Claro', bgColor: 'bg-white', textColor: 'text-gray-900' },
    { id: 'dark', name: 'Escuro', bgColor: 'bg-gray-900', textColor: 'text-white' },
    { id: 'system', name: 'Sistema', bgColor: 'bg-gray-200', textColor: 'text-gray-700' },
    { id: 'custom', name: 'Personalizado', bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500', textColor: 'text-white' },
  ]
  
  // Função para lidar com a mudança de cor
  const handleColorChange = (color: { hex: string }) => {
    setAccentColor(color.hex)
  }
  
  // Função para aplicar a cor selecionada
  const handleColorChangeComplete = (color: { hex: string }) => {
    onAccentColorChange(color.hex)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-3">Tema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                currentTheme === theme.id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              } ${theme.bgColor} ${theme.textColor}`}
            >
              <div className="text-center">
                <div className="font-medium">{theme.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {currentTheme === 'custom' && (
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">Cor de Destaque</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
              style={{ backgroundColor: accentColor }}
              aria-label="Selecionar cor de destaque"
            />
            <div className="text-sm text-gray-700">{accentColor}</div>
          </div>
          
          {showColorPicker && (
            <div className="absolute mt-2 z-10">
              <div 
                className="fixed inset-0" 
                onClick={() => setShowColorPicker(false)}
              />
              <SketchPicker
                color={accentColor}
                onChange={handleColorChange}
                onChangeComplete={handleColorChangeComplete}
              />
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-5 gap-2">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'].map((color) => (
              <button
                key={color}
                onClick={() => {
                  setAccentColor(color)
                  onAccentColorChange(color)
                }}
                className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}`}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Pré-visualização</h4>
        <div 
          className={`p-4 rounded-lg ${
            currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div 
              className="w-8 h-8 rounded-full" 
              style={{ backgroundColor: accentColor }}
            />
            <div>
              <div className="font-medium">Texto de exemplo</div>
              <div className="text-sm opacity-75">Subtexto de exemplo</div>
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              className="px-3 py-1 rounded-md text-white text-sm"
              style={{ backgroundColor: accentColor }}
            >
              Botão Primário
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm border ${
                currentTheme === 'dark' ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'
              }`}
            >
              Botão Secundário
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
