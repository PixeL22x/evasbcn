'use client'

import { useState, useEffect } from 'react'
import { validateAndCompressPhoto, getImageInfo } from '../lib/image-compression'

export default function PhotoTask({
  task,
  currentStep,
  totalSteps,
  onComplete,
  onNext,
  cierreId,
  trabajador
}) {
  const [fotos, setFotos] = useState({})
  const [isUploading, setIsUploading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  // Inicializar las fotos requeridas solo cuando cambia la tarea (no las fotosRequeridas)
  useEffect(() => {
    let fotosRequeridasArray = []

    // Parsear fotosRequeridas si es un string JSON
    if (task.fotosRequeridas) {
      if (typeof task.fotosRequeridas === 'string') {
        try {
          fotosRequeridasArray = JSON.parse(task.fotosRequeridas)
        } catch (error) {
          console.error('Error parsing fotosRequeridas:', error)
          fotosRequeridasArray = []
        }
      } else if (Array.isArray(task.fotosRequeridas)) {
        fotosRequeridasArray = task.fotosRequeridas
      }
    }

    if (fotosRequeridasArray.length > 0) {
      const fotosIniciales = {}
      fotosRequeridasArray.forEach((foto, index) => {
        fotosIniciales[foto.tipo] = {
          file: null,
          preview: null,
          uploaded: false,
          descripcion: foto.descripcion
        }
      })
      setFotos(fotosIniciales)
    }

    // Resetear el estado de completado cuando cambia la tarea
    setIsCompleted(false)
    setIsUploading(false)
  }, [task.id]) // Solo cuando cambia el ID de la tarea, no las fotosRequeridas

  // Forzar re-render cuando cambian las fotos para actualizar canComplete
  useEffect(() => {
    // Este useEffect se ejecuta cada vez que cambia el estado de fotos
    // Esto asegura que canComplete() se evalúe con el estado más reciente
    // Forzar re-render cuando cambian las fotos para actualizar canComplete
  }, [fotos])

  const handleImageUpload = async (tipo, file, preview) => {
    try {
      setUploadProgress(`Procesando foto ${tipo}...`)

      // Obtener información de la imagen
      const imageInfo = await getImageInfo(file)
      console.log(`📸 Foto ${tipo}:`, imageInfo)

      // Comprimir automáticamente si es necesario
      setUploadProgress(`Comprimiendo foto ${tipo}...`)
      const compressedFile = await validateAndCompressPhoto(file)

      // Crear preview de la imagen comprimida
      const compressedPreview = URL.createObjectURL(compressedFile)

      setFotos(prev => {
        const newState = {
          ...prev,
          [tipo]: {
            ...prev[tipo],
            file: compressedFile,
            preview: compressedPreview,
            uploaded: false,
            uploading: true,
            descripcion: prev[tipo]?.descripcion || '',
            originalSize: imageInfo.sizeMB,
            compressedSize: Math.round(compressedFile.size / 1024 / 1024 * 100) / 100,
            needsCompression: imageInfo.needsCompression
          }
        }
        return newState
      })

      setUploadProgress(`Subiendo foto ${tipo}...`)
      console.log(`✅ Foto ${tipo} procesada, iniciando subida inmediata`)

      // Subir inmediatamente a Cloudinary
      await uploadSinglePhoto(tipo, compressedFile, imageInfo)

      setUploadProgress('')

    } catch (error) {
      console.error(`❌ Error procesando foto ${tipo}:`, error)
      setUploadProgress('')

      // Actualizar estado con error
      setFotos(prev => ({
        ...prev,
        [tipo]: {
          ...prev[tipo],
          error: error.message,
          uploading: false
        }
      }))

      alert(`Error al procesar la foto ${tipo}: ${error.message}`)
    }
  }

  const uploadSinglePhoto = async (tipo, file, imageInfo) => {
    try {
      console.log(`☁️ Subiendo foto ${tipo} inmediatamente...`)

      const formData = new FormData()
      formData.append('cierreId', cierreId)
      formData.append('trabajador', trabajador)
      formData.append('tareaId', task.id)
      formData.append('tipo', tipo)
      formData.append('descripcion', fotos[tipo]?.descripcion || tipo)
      formData.append('file', file)

      const response = await fetch('/api/tarea/foto-individual', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error subiendo foto')
      }

      console.log(`✅ Foto ${tipo} subida exitosamente`)

      // Actualizar estado con éxito
      setFotos(prev => ({
        ...prev,
        [tipo]: {
          ...prev[tipo],
          uploaded: true,
          uploading: false,
          url: result.foto.url,
          publicId: result.foto.publicId
        }
      }))

      // Verificar si todas las fotos están subidas para completar la tarea
      setTimeout(() => {
        checkAndCompleteTask()
      }, 100)

    } catch (error) {
      console.error(`❌ Error subiendo foto ${tipo}:`, error)

      // Actualizar estado con error
      setFotos(prev => ({
        ...prev,
        [tipo]: {
          ...prev[tipo],
          error: error.message,
          uploading: false
        }
      }))

      throw error
    }
  }

  const checkAndCompleteTask = () => {
    setFotos(currentFotos => {
      // Verificar si todas las fotos están subidas
      let fotosRequeridasArray = []
      if (task.fotosRequeridas) {
        if (typeof task.fotosRequeridas === 'string') {
          try {
            fotosRequeridasArray = JSON.parse(task.fotosRequeridas)
          } catch (error) {
            console.error('Error parsing fotosRequeridas:', error)
            return currentFotos
          }
        } else if (Array.isArray(task.fotosRequeridas)) {
          fotosRequeridasArray = task.fotosRequeridas
        }
      }

      const todasLasFotosSubidas = fotosRequeridasArray.every(foto => {
        const fotoData = currentFotos[foto.tipo]
        return fotoData && fotoData.file && fotoData.uploaded && !fotoData.error
      })

      if (todasLasFotosSubidas && !isUploading && !isCompleted) {
        console.log('🎉 Todas las fotos subidas, completando tarea...')
        handleCompleteWithState(currentFotos)
      }

      return currentFotos
    })
  }


  const handleImageRemove = (tipo) => {
    setFotos(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        file: null,
        preview: null,
        uploaded: false
      }
    }))
  }

  const canComplete = () => {
    try {

      // Si no hay fotos requeridas, no se puede completar
      if (!task.fotosRequeridas) {
        return false
      }

      let fotosRequeridasArray = []

      // Parsear fotosRequeridas si es un string JSON
      if (typeof task.fotosRequeridas === 'string') {
        try {
          fotosRequeridasArray = JSON.parse(task.fotosRequeridas)
        } catch (error) {
          console.error('Error parsing fotosRequeridas:', error)
          return false
        }
      } else if (Array.isArray(task.fotosRequeridas)) {
        fotosRequeridasArray = task.fotosRequeridas
      }

      // Si no hay fotos requeridas, no se puede completar
      if (fotosRequeridasArray.length === 0) {
        return false
      }

      // Contar cuántas fotos están listas
      let fotosListas = 0
      let fotosRequeridas = fotosRequeridasArray.length

      fotosRequeridasArray.forEach(foto => {
        const tieneArchivo = fotos[foto.tipo] && fotos[foto.tipo].file
        if (tieneArchivo) {
          fotosListas++
        }
      })

      const resultado = fotosListas === fotosRequeridas
      return resultado
    } catch (error) {
      console.error('Error en canComplete:', error)
      return false
    }
  }

  const handleComplete = async () => {

    // Evitar múltiples ejecuciones
    if (isUploading || isCompleted) {
      return
    }

    setIsUploading(true)
    setUploadProgress('Preparando fotos...')

    try {
      // Subir las fotos al servidor inmediatamente
      const formData = new FormData()
      formData.append('cierreId', cierreId)
      formData.append('trabajador', trabajador)
      formData.append('tareaId', task.id)

      // Parsear fotosRequeridas para obtener el array
      let fotosRequeridasArray = []
      if (task.fotosRequeridas) {
        if (typeof task.fotosRequeridas === 'string') {
          try {
            fotosRequeridasArray = JSON.parse(task.fotosRequeridas)
          } catch (error) {
            console.error('Error parsing fotosRequeridas:', error)
            fotosRequeridasArray = []
          }
        } else if (Array.isArray(task.fotosRequeridas)) {
          fotosRequeridasArray = task.fotosRequeridas
        }
      }

      // Agregar cada foto al FormData

      fotosRequeridasArray.forEach((foto, index) => {

        if (fotos[foto.tipo]?.file) {
          formData.append(`foto_${index}`, fotos[foto.tipo].file)
          formData.append(`tipo_${index}`, foto.tipo)
          formData.append(`descripcion_${index}`, foto.descripcion)
        } else {
        }
      })

      // Verificar que el FormData tenga fotos
      let fotoCount = 0
      for (let [key, value] of formData.entries()) {
        if (key.startsWith('foto_')) {
          fotoCount++
        }
      }

      // Subir fotos al servidor
      const fotosResponse = await fetch(`${window.location.origin}/api/tarea/fotos`, {
        method: 'POST',
        body: formData,
      })

      if (!fotosResponse.ok) {
        const errorData = await fotosResponse.json().catch(() => ({}))
        console.error('❌ Error response from server:', errorData)

        let errorMessage = 'Error al subir las fotos'
        if (errorData.error) {
          errorMessage = errorData.error
        }
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`
        }

        throw new Error(errorMessage)
      }

      // Marcar la tarea como completada
      const tareaResponse = await fetch(`${window.location.origin}/api/tarea`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tareaId: task.id,
          completada: true,
          cierreId: cierreId,
        }),
      })

      if (tareaResponse.ok) {
        setIsCompleted(true)
        onComplete(task.id)
        // Auto-avanzar después de subir las fotos
        setTimeout(() => {
          onNext()
        }, 1500) // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito
      } else {
        throw new Error('Error al marcar la tarea como completada')
      }
    } catch (error) {
      console.error('❌ Error al completar la tarea:', error)

      // Mostrar mensaje de error más específico
      let userMessage = 'Error al completar la tarea. Inténtalo de nuevo.'

      if (error.message.includes('Cloudinary')) {
        userMessage = 'Error al subir las fotos al servidor. Verifica tu conexión a internet e inténtalo de nuevo.'
      } else if (error.message.includes('compresión') || error.message.includes('Sharp')) {
        userMessage = 'Error al procesar las imágenes. Inténtalo con fotos más pequeñas.'
      } else if (error.message.includes('base de datos')) {
        userMessage = 'Error al guardar la información. Inténtalo de nuevo en unos momentos.'
      } else if (error.message.includes('variables de entorno')) {
        userMessage = 'Error de configuración del servidor. Contacta al administrador.'
      }

      alert(userMessage)
      setUploadProgress('')
    } finally {
      setIsUploading(false)
    }
  }

  // Nueva función que usa el estado pasado como parámetro
  const handleCompleteWithState = async (fotosState) => {

    // Evitar múltiples ejecuciones
    if (isUploading || isCompleted) {
      return
    }

    setIsUploading(true)
    setUploadProgress('Completando tarea...')

    try {
      console.log('🎉 Todas las fotos ya están subidas, completando tarea...')

      // Marcar la tarea como completada (las fotos ya están en la BD)
      const tareaResponse = await fetch(`${window.location.origin}/api/tarea`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tareaId: task.id,
          completada: true,
          cierreId: cierreId,
        }),
      })

      if (!tareaResponse.ok) {
        const errorData = await tareaResponse.json().catch(() => ({}))
        console.error('❌ Error completando tarea:', errorData)
        throw new Error(errorData.error || 'Error completando tarea')
      }

      const tareaData = await tareaResponse.json()
      console.log('✅ Tarea completada exitosamente:', tareaData)

      setUploadProgress('¡Tarea completada con éxito!')
      setIsCompleted(true)

      // Llamar a onComplete después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        onComplete(task.id)
        onNext()
      }, 1000)
    } catch (error) {
      console.error('❌ Error al completar la tarea:', error)

      // Mostrar mensaje de error más específico
      let userMessage = 'Error al completar la tarea. Inténtalo de nuevo.'

      if (error.message.includes('Request timeout') || error.message.includes('Timeout')) {
        userMessage = 'La subida de fotos tardó demasiado tiempo. Inténtalo de nuevo con fotos más pequeñas.'
      } else if (error.message.includes('Cloudinary')) {
        userMessage = 'Error al subir las fotos al servidor. Verifica tu conexión a internet e inténtalo de nuevo.'
      } else if (error.message.includes('compresión') || error.message.includes('Sharp')) {
        userMessage = 'Error al procesar las imágenes. Inténtalo con fotos más pequeñas.'
      } else if (error.message.includes('base de datos')) {
        userMessage = 'Error al guardar la información. Inténtalo de nuevo en unos momentos.'
      } else if (error.message.includes('variables de entorno')) {
        userMessage = 'Error de configuración del servidor. Contacta al administrador.'
      } else if (error.message.includes('413') || error.message.includes('Content Too Large') || error.message.includes('demasiado grande')) {
        userMessage = 'Las fotos son demasiado grandes. Inténtalo con imágenes más pequeñas (máximo 10MB por foto).'
      } else if (error.message.includes('timeout')) {
        userMessage = 'La subida de fotos tardó demasiado. Inténtalo de nuevo.'
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        userMessage = 'Error de conexión de red. Verifica tu internet e inténtalo de nuevo.'
      } else if (error.message.includes('Archivo demasiado grande')) {
        userMessage = 'Una o más fotos son demasiado grandes. Redúcelas de tamaño e inténtalo de nuevo.'
      }

      alert(userMessage)
      setUploadProgress('')
    } finally {
      setIsUploading(false)
    }
  }

  const getTaskIcon = (taskName) => {
    const icons = {
      'Apuntar info cierre en libreta, imprimir, grapar': '📝',
    }
    return icons[taskName] || '📸'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
      {/* Sticky Header - Compacto y siempre visible */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 pt-safe">
        <div className="px-4 py-3">
          {/* Header compacto */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{getTaskIcon(task.nombre)}</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">
                  {task.nombre}
                </h1>
                <p className="text-xs text-white/60">
                  Paso {currentStep} de {totalSteps}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar compacta */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/60 font-medium min-w-[3rem] text-right">
              {Math.round(((currentStep - 1) / totalSteps) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Contenido Scrollable */}
      <div className="px-4 py-4 pb-safe">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Info de la tarea */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">⏱️ Tiempo estimado</span>
              <span className="text-white font-semibold">{task.duracion} min</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-yellow-400 text-xs font-medium">
                📸 {Object.keys(fotos).length} foto{Object.keys(fotos).length !== 1 ? 's' : ''} requerida{Object.keys(fotos).length !== 1 ? 's' : ''}
              </p>
              {!canComplete() && (
                <p className="text-red-400 text-xs font-medium mt-1">
                  ⚠️ Faltan {Object.values(fotos).filter(foto => !foto.file).length} por subir
                </p>
              )}
              <p className="text-blue-400 text-xs mt-1">
                ⚡ Se suben automáticamente al seleccionarlas
              </p>
            </div>
          </div>

          {/* Tarjetas de Fotos */}
          <div className="space-y-3">
            {(() => {
              let fotosRequeridasArray = []

              if (task.fotosRequeridas) {
                if (typeof task.fotosRequeridas === 'string') {
                  try {
                    fotosRequeridasArray = JSON.parse(task.fotosRequeridas)
                  } catch (error) {
                    console.error('Error parsing fotosRequeridas:', error)
                    fotosRequeridasArray = []
                  }
                } else if (Array.isArray(task.fotosRequeridas)) {
                  fotosRequeridasArray = task.fotosRequeridas
                }
              }

              return fotosRequeridasArray.map((foto, index) => (
                <div key={foto.tipo} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                  {/* Header de la foto */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-base flex-1 min-w-0 pr-2">
                      {foto.descripcion}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${fotos[foto.tipo]?.uploaded
                      ? 'bg-green-500/20 text-green-400'
                      : fotos[foto.tipo]?.uploading
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                      }`}>
                      {fotos[foto.tipo]?.uploaded ? '✓ Subida' : fotos[foto.tipo]?.uploading ? '⏳ Subiendo' : 'Pendiente'}
                    </div>
                  </div>

                  {/* Input de foto */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        const preview = URL.createObjectURL(file)
                        handleImageUpload(foto.tipo, file, preview)
                      }
                    }}
                    className="hidden"
                    id={`file-${foto.tipo}`}
                    disabled={isUploading || fotos[foto.tipo]?.uploading}
                  />

                  <label
                    htmlFor={`file-${foto.tipo}`}
                    className={`block cursor-pointer ${isUploading || fotos[foto.tipo]?.uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`
                      relative overflow-hidden rounded-xl border-2 border-dashed
                      transition-all active:scale-[0.98]
                      ${fotos[foto.tipo]?.preview
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-white/30 bg-white/5 active:bg-white/10'
                      }
                    `}>
                      {fotos[foto.tipo]?.preview ? (
                        <div className="relative aspect-video">
                          <img
                            src={fotos[foto.tipo].preview}
                            alt={foto.descripcion}
                            className="w-full h-full object-cover"
                          />

                          {/* Overlay con estado */}
                          {fotos[foto.tipo]?.uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                              <div className="text-center">
                                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-white text-sm font-medium">Subiendo...</p>
                              </div>
                            </div>
                          )}

                          {fotos[foto.tipo]?.uploaded && (
                            <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-lg">✓</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video flex flex-col items-center justify-center py-6">
                          <div className="text-4xl mb-2">📸</div>
                          <p className="text-white font-medium text-sm">Toca para seleccionar</p>
                          <p className="text-white/60 text-xs mt-1">JPG, PNG, GIF</p>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Info de compresión y error */}
                  {fotos[foto.tipo]?.originalSize && (
                    <div className="mt-2 text-xs text-white/60 flex items-center gap-2">
                      <span>📦</span>
                      <span>{fotos[foto.tipo].originalSize}MB → {fotos[foto.tipo].compressedSize}MB</span>
                    </div>
                  )}

                  {fotos[foto.tipo]?.error && (
                    <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
                      <span>❌</span>
                      <span>{fotos[foto.tipo].error}</span>
                    </div>
                  )}

                  {/* Botón para eliminar foto */}
                  {fotos[foto.tipo]?.preview && !fotos[foto.tipo]?.uploading && (
                    <button
                      onClick={() => handleImageRemove(foto.tipo)}
                      className="mt-3 w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors active:scale-[0.98]"
                      disabled={isUploading}
                    >
                      🗑️ Eliminar foto
                    </button>
                  )}
                </div>
              ))
            })()}
          </div>

          {/* Estado de completado */}
          {isCompleted && (
            <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-green-400 text-lg font-bold mb-1">
                ¡Tarea Completada!
              </p>
              <p className="text-green-300/70 text-sm">
                Avanzando automáticamente...
              </p>
            </div>
          )}

          {/* Mensaje de progreso */}
          {uploadProgress && !isCompleted && (
            <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-4 border border-blue-500/30 text-center">
              <div className="w-6 h-6 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-blue-400 text-sm font-medium">
                {uploadProgress}
              </p>
              <p className="text-blue-300/70 text-xs mt-1">
                Por favor espera...
              </p>
            </div>
          )}

          {/* Indicadores de navegación */}
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex space-x-1.5">
              {Array.from({ length: totalSteps }, (_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index < currentStep - 1
                    ? 'bg-green-400'
                    : index === currentStep - 1
                      ? 'bg-blue-400 w-6'
                      : 'bg-white/30'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
