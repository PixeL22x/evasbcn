'use client'

import { useState, useEffect } from 'react'

export default function VentasTask({ 
  task, 
  currentStep, 
  totalSteps, 
  onComplete, 
  onNext, 
  cierreId,
  trabajador
}) {
  const [totalVentas, setTotalVentas] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Resetear estado cuando cambia la tarea
  useEffect(() => {
    setIsCompleted(false)
    setIsUploading(false)
    setTotalVentas('')
  }, [task.id])

  const canComplete = () => {
    return totalVentas.trim() !== '' && !isNaN(parseFloat(totalVentas)) && parseFloat(totalVentas) >= 0
  }

  const handleComplete = async () => {
    if (!canComplete()) {
      alert('Debes ingresar un total de ventas válido.')
      return
    }

    setIsUploading(true)

    try {
      // Guardar el total de ventas en el cierre
      const ventasResponse = await fetch(`${window.location.origin}/api/cierre/${cierreId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalVentas: parseFloat(totalVentas)
        }),
      })

      if (!ventasResponse.ok) {
        throw new Error('Error al guardar el total de ventas')
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
        // Auto-avanzar después de guardar las ventas
        setTimeout(() => {
          onNext()
        }, 1500) // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito
      } else {
        throw new Error('Error al marcar la tarea como completada')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al completar la tarea. Inténtalo de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const formatCurrency = (value) => {
    const num = parseFloat(value)
    return isNaN(num) ? '' : num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 lg:mb-6">
            <span className="text-2xl sm:text-3xl lg:text-4xl">💰</span>
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
              💰 Ingresa el total de ventas del día
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <label className="block text-white font-medium text-sm sm:text-base mb-3">
                Total de ventas (€)
              </label>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 text-lg">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalVentas}
                  onChange={(e) => setTotalVentas(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-lg"
                  disabled={isUploading || isCompleted}
                />
              </div>
              
              {totalVentas && canComplete() && (
                <p className="mt-2 text-green-400 text-sm">
                  Total formateado: €{formatCurrency(totalVentas)}
                </p>
              )}
              
              {totalVentas && !canComplete() && (
                <p className="mt-2 text-red-400 text-sm">
                  Ingresa un valor numérico válido mayor o igual a 0
                </p>
              )}
            </div>
          </div>

          {/* Completion Status */}
          {isCompleted && (
            <div className="text-center mb-6">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3 lg:mb-4">✅</div>
              <p className="text-green-400 text-sm sm:text-base lg:text-lg font-medium">
                ¡Total de ventas guardado correctamente! Avanzando automáticamente...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 lg:gap-4 justify-center">
            {isUploading ? (
              <div className="text-center w-full">
                <div className="text-blue-400 text-base font-semibold mb-2">
                  ⏳ Guardando ventas...
                </div>
                <div className="text-white/60 text-sm">
                  Por favor espera mientras se guarda la información
                </div>
              </div>
            ) : isCompleted ? (
              <div className="text-center w-full">
                <div className="text-green-400 text-sm sm:text-base lg:text-lg font-medium mb-3">
                  ✅ Tarea completada
                </div>
                <div className="text-blue-400 text-sm font-medium">
                  ⏳ Avanzando automáticamente...
                </div>
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canComplete()}
                className={`w-full font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform shadow-lg text-sm sm:text-base ${
                  canComplete()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105'
                    : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                }`}
              >
                ✅ Guardar Total
              </button>
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
