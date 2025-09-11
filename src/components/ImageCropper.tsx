'use client'

import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
  aspect?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  aspect = 1 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Quando a imagem é carregada, centraliza o recorte
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }
  
  // Atualiza o canvas de preview quando o recorte é alterado
  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      // Desenha o recorte no canvas
      const image = imgRef.current
      const canvas = previewCanvasRef.current
      const crop = completedCrop
      
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        return
      }
      
      const pixelRatio = window.devicePixelRatio
      
      canvas.width = crop.width * pixelRatio
      canvas.height = crop.height * pixelRatio
      
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.imageSmoothingQuality = 'high'
      
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      )
    }
  }, [completedCrop])
  
  // Função para gerar a imagem recortada
  function handleCropComplete() {
    if (!completedCrop || !previewCanvasRef.current) {
      return
    }
    
    const canvas = previewCanvasRef.current
    const croppedImageUrl = canvas.toDataURL('image/jpeg')
    onCropComplete(croppedImageUrl)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recortar Imagem</h3>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="Imagem para recorte"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[60vh]"
                />
              </ReactCrop>
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pré-visualização</h4>
              <div className="border rounded-full overflow-hidden h-32 w-32 flex items-center justify-center bg-gray-100">
                {completedCrop ? (
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full max-h-full"
                    style={{
                      width: completedCrop.width,
                      height: completedCrop.height,
                      borderRadius: '50%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div className="text-sm text-gray-400">
                    Ajuste o recorte
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCropComplete}
            disabled={!completedCrop?.width || !completedCrop?.height}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !completedCrop?.width || !completedCrop?.height
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
