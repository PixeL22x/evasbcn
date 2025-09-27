'use client'

import { useState, useEffect } from 'react'

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

  const handleImageUpload = (tipo, file, preview) => {
    
    setFotos(prev => {
      const newState = {
        ...prev,
        [tipo]: {
          ...prev[tipo],
          file,
          preview,
          uploaded: false,
          descripcion: prev[tipo]?.descripcion || ''
        }
      }
      return newState
    })
    
    // Usar un timeout más largo para asegurar que el estado se actualice
    setTimeout(() => {
      setFotos(currentFotos => {
        
        // Verificar si todas las fotos están listas
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
          const tieneArchivo = currentFotos[foto.tipo] && currentFotos[foto.tipo].file
          return tieneArchivo
        })


        if (todasLasFotosSubidas && !isUploading && !isCompleted) {
          // Llamar handleComplete con el estado actual
          handleCompleteWithState(currentFotos)
        }
        
        return currentFotos
      })
    }, 200)
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
        throw new Error('Error al subir las fotos')
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

      // Agregar cada foto al FormData usando el estado pasado
      
      fotosRequeridasArray.forEach((foto, index) => {
        
        if (fotosState[foto.tipo]?.file) {
          formData.append(`foto_${index}`, fotosState[foto.tipo].file)
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
        throw new Error('Error al subir las fotos')
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

  const getTaskIcon = (taskName) => {
    const icons = {
      'Apuntar info cierre en libreta, imprimir, grapar': '📝',
    }
    return icons[taskName] || '📸'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 lg:mb-6">
            <span className="text-2xl sm:text-3xl lg:text-4xl">{getTaskIcon(task.nombre)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 sm:mb-2">
            {task.nombre}
          </h1>
          <p className="text-white/70 text-sm sm:text-base lg:text-lg">
            Paso {currentStep} de {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex justify-between text-white/60 text-xs sm:text-sm mb-2">
            <span>Progreso del cierre</span>
            <span>{Math.round(((currentStep - 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Task Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 mb-4 sm:mb-6 lg:mb-8 border border-white/20">
          <div className="text-center mb-3 sm:mb-4 lg:mb-6">
            <p className="text-white/70 text-xs sm:text-sm lg:text-base xl:text-lg">
              Tiempo estimado: {task.duracion} minutos
            </p>
            <p className="text-yellow-400 text-sm sm:text-base font-medium mt-2">
              📸 Esta tarea requiere subir {Object.keys(fotos).length} foto{Object.keys(fotos).length !== 1 ? 's' : ''} específica{Object.keys(fotos).length !== 1 ? 's' : ''}
            </p>
            {!canComplete() && (
              <p className="text-red-400 text-sm font-medium mt-1">
                ❌ Faltan {Object.values(fotos).filter(foto => !foto.file).length} foto{Object.values(fotos).filter(foto => !foto.file).length !== 1 ? 's' : ''} por subir
              </p>
            )}
            <p className="text-blue-400 text-xs mt-1">
              ℹ️ Las fotos se subirán automáticamente al completar esta tarea
            </p>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4 mb-6">
            {(() => {
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
              
              return fotosRequeridasArray.map((foto, index) => (
              <div key={foto.tipo} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl">
                    {foto.descripcion}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {fotos[foto.tipo]?.file ? (
                      <span className="text-green-400 text-base font-semibold">✅ Subida</span>
                    ) : (
                      <span className="text-red-400 text-base font-semibold">❌ Pendiente</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
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
                    disabled={isUploading}
                  />
                  
                  <label
                    htmlFor={`file-${foto.tipo}`}
                    className={`block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                      fotos[foto.tipo]?.file
                        ? 'border-green-400 bg-green-50/10 text-green-400'
                        : 'border-gray-300 hover:border-blue-400 text-gray-400 hover:text-blue-400'
                    }`}
                  >
                    {fotos[foto.tipo]?.file ? (
                      <div>
                        <div className="text-3xl mb-3">✅</div>
                        <p className="text-base font-semibold">Foto seleccionada</p>
                        <p className="text-sm opacity-75">Haz clic para cambiar</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl mb-3">📸</div>
                        <p className="text-base font-semibold">Haz clic para seleccionar foto</p>
                        <p className="text-sm opacity-75">JPG, PNG, GIF</p>
                      </div>
                    )}
                  </label>
                  
                  {fotos[foto.tipo]?.preview && (
                    <div className="mt-2">
                      <img
                        src={fotos[foto.tipo].preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-white/20"
                      />
                      <button
                        onClick={() => handleImageRemove(foto.tipo)}
                        className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                        disabled={isUploading}
                      >
                        Eliminar foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
            })()}
          </div>

          {/* Completion Status */}
          {isCompleted && (
            <div className="text-center mb-6">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3 lg:mb-4">✅</div>
              <p className="text-green-400 text-sm sm:text-base lg:text-lg font-medium">
                ¡Todas las fotos subidas correctamente! Avanzando automáticamente...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 lg:gap-4 justify-center">
            {isUploading ? (
              <div className="text-center w-full">
                <div className="text-blue-400 text-base font-semibold mb-2">
                  ⏳ {uploadProgress || 'Subiendo fotos...'}
                </div>
                <div className="text-white/60 text-sm mb-2">
                  Por favor espera mientras se procesan las fotos
                </div>
                <div className="text-xs text-white/40">
                  ⚡ Comprimiendo imágenes para subida más rápida
                </div>
              </div>
            ) : isCompleted ? (
              <div className="text-center">
                <div className="text-green-400 text-sm sm:text-base lg:text-lg font-medium mb-3">
                  ✅ Tarea completada
                </div>
                <div className="text-blue-400 text-sm font-medium">
                  ⏳ Avanzando automáticamente...
                </div>
              </div>
            ) : (
              <div className="text-center w-full">
                <div className="text-yellow-400 text-base font-semibold mb-2">
                  📸 Sube todas las fotos requeridas
                </div>
                <div className="text-white/60 text-sm">
                  La tarea se completará automáticamente cuando subas todas las fotos
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="flex space-x-1 sm:space-x-2">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  index < currentStep - 1 
                    ? 'bg-green-400' 
                    : index === currentStep - 1
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="text-white/60 text-xs sm:text-sm">
            {currentStep} / {totalSteps}
          </div>
        </div>
      </div>
    </div>
  )
}
