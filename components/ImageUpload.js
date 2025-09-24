'use client'

import { useState, useRef } from 'react'

export default function ImageUpload({ 
  onUpload, 
  onRemove, 
  images = [], 
  maxImages = 5,
  turno = 'mañana',
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
  }

  const handleFiles = async (files) => {
    if (files.length === 0) return

    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Por favor selecciona solo archivos de imagen')
      return
    }

    if (images.length + imageFiles.length > maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    setUploading(true)

    try {
      for (const file of imageFiles) {
        await uploadImage(file)
      }
    } catch (error) {
      console.error('Error al subir imágenes:', error)
      alert('Error al subir las imágenes. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', `evas-tickets/${turno}`)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('Error al subir la imagen')
    }

    const data = await response.json()
    onUpload({
      url: data.secure_url,
      publicId: data.public_id,
      originalName: file.name,
      size: file.size
    })
  }

  const removeImage = (index) => {
    onRemove(index)
  }

  return (
    <div className="w-full">
      {/* Área de subida */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-400 bg-blue-50/10'
            : disabled
            ? 'border-gray-500 bg-gray-50/5 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/5 cursor-pointer'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/70">Subiendo imágenes...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="text-4xl">📸</div>
            <p className="text-white font-medium">
              {disabled ? 'Subida deshabilitada' : 'Arrastra imágenes aquí o haz clic para seleccionar'}
            </p>
            <p className="text-white/60 text-sm">
              Máximo {maxImages} imágenes • JPG, PNG, GIF
            </p>
          </div>
        )}
      </div>

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-white font-medium mb-2">
            Imágenes subidas ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Ticket ${turno} ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-white/20"
                />
                {!disabled && (
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                  {image.originalName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
