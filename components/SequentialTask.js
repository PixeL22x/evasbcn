'use client'

import { useState, useEffect } from 'react'
import CircularTimer from './CircularTimer'

export default function SequentialTask({ 
  task, 
  currentStep, 
  totalSteps, 
  onComplete, 
  onNext, 
  onPrevious,
  showTimer = true 
}) {
  const [timeLeft, setTimeLeft] = useState((task.duration || task.duracion) * 60)
  const [isRunning, setIsRunning] = useState(true)
  const [isCompleted, setIsCompleted] = useState(task.completed || task.completada)

  // Sincronizar el estado local con el estado de la tarea
  useEffect(() => {
    const isTaskCompleted = task.completed || task.completada
    setIsCompleted(isTaskCompleted)
    
    // Solo resetear el temporizador si la tarea no está completada
    if (!isTaskCompleted) {
      setTimeLeft((task.duration || task.duracion) * 60)
      setIsRunning(true) // Iniciar automáticamente el temporizador
    } else {
      // Si la tarea ya está completada, pausar el temporizador
      setIsRunning(false)
    }
  }, [task.id, task.completed, task.completada, task.duration, task.duracion])

  useEffect(() => {
    let interval = null
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      handleComplete()
    }
    
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const handleComplete = async () => {
    setIsCompleted(true)
    setIsRunning(false)
    
    try {
      // Actualizar la tarea en la base de datos
      const response = await fetch('/api/tarea', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tareaId: task.id,
          completada: true,
          cierreId: task.cierreId,
        }),
      })

      if (response.ok) {
        onComplete(task.id)
        
        // Auto-avanzar a la siguiente tarea después de un breve delay
        setTimeout(() => {
          onNext()
        }, 1500) // 1.5 segundos para mostrar la confirmación
      } else {
        console.error('Error al actualizar la tarea')
        // Revertir el estado local si falla la actualización
        setIsCompleted(false)
        setIsRunning(true)
      }
    } catch (error) {
      console.error('Error:', error)
      // Revertir el estado local si falla la actualización
      setIsCompleted(false)
      setIsRunning(true)
    }
  }

  const handleStartTimer = () => {
    if (!isCompleted) {
      setIsRunning(!isRunning)
    }
  }


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTaskIcon = (taskName) => {
    const icons = {
      'Apagar luces todas menos blancas': '💡',
      'Meter carteles': '📋',
      'Cerrar puerta y persiana': '🚪',
      'Sacar basura': '🗑️',
      'Limpiar con esponja lugar de cucharas ISA': '🧽',
      'Guardar smoothies a Nevera blanca': '❄️',
      'Sacar pinchos': '🍢',
      'Tapar helados': '🍦',
      'Guardar helados repetidos a arcon': '📦',
      'Sacar cucharas y pinchos a secar': '🍴',
      'Apuntar info cierre en libreta, imprimir, grapar': '📝',
      'Enviar foto de maquinas apagadas (gofre, aire)': '📸',
      'Apagar y cargar datafonos': '💳',
      'Apagar justeat, tpv, ventilador de techo': '🔌'
    }
    return icons[taskName] || '✅'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 lg:mb-6">
            <span className="text-2xl sm:text-3xl lg:text-4xl">{getTaskIcon(task.name || task.nombre)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 sm:mb-2">
            {task.name || task.nombre}
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
            <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3 lg:mb-4">{getTaskIcon(task.name || task.nombre)}</div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
              {task.name || task.nombre}
            </h2>
            <p className="text-white/70 text-xs sm:text-sm lg:text-base xl:text-lg">
              Tiempo estimado: {task.duration || task.duracion} minutos
            </p>
          </div>

          {/* Timer Section - Integrado */}
          {showTimer && (
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6 border border-white/10">
              <CircularTimer
                timeLeft={timeLeft}
                totalTime={(task.duration || task.duracion) * 60}
                isRunning={isRunning}
                onToggle={handleStartTimer}
                isCompleted={isCompleted}
              />
            </div>
          )}

          {/* Completion Status */}
          {isCompleted && (
            <div className="text-center mb-3 sm:mb-4 lg:mb-6">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3 lg:mb-4">✅</div>
              <p className="text-green-400 text-sm sm:text-base lg:text-lg font-medium">
                Avanzando a la siguiente tarea...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 lg:gap-4 justify-center">
            {!isCompleted ? (
              <button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                ✅ OK
              </button>
            ) : (
              <div className="text-center w-full">
                <div className="text-green-400 text-sm sm:text-base lg:text-lg font-medium">
                  ✅ Tarea completada
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-4">
          <button
            onClick={onPrevious}
            disabled={currentStep === 1 || isRunning}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base ${
              currentStep === 1 || isRunning
                ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            ← Anterior
          </button>

          <div className="flex space-x-1 sm:space-x-2 order-3 w-full sm:w-auto justify-center sm:justify-start">
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

          <div className="text-white/60 text-xs sm:text-sm order-2 sm:order-3">
            {currentStep} / {totalSteps}
          </div>
        </div>
      </div>
    </div>
  )
}
