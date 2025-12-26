'use client'

import { useState, useEffect } from 'react'
import CircularTimer from './CircularTimer'
import PhotoTask from './PhotoTask'
import VentasTask from './VentasTask'
import TicketScannerTask from './TicketScannerTask'

export default function SequentialTask({
  task,
  currentStep,
  totalSteps,
  onComplete,
  onNext,
  showTimer = true,
  cierreId,
  trabajador
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

        // Solo auto-avanzar si la tarea NO requiere fotos ni input
        if (!task.requiereFotos && !task.requiereInput) {
          setTimeout(() => {
            onNext()
          }, 1500) // 1.5 segundos para mostrar la confirmación
        }
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
      // Pre-cierre / Limpieza Inicial (1-6)
      '¿La pica está limpia?': '✅',
      'Preparar cubeta con agua + fairy (para cucharas y separadores)': '🧴',
      'Guardar cosas secas': '📦',
      'Poner todos los trapos en cubo con agua + lejía': '🧺',
      'Separar helados restos → congelador gris (parte superior)': '🍦',
      'Barrer y aspirar el local': '🧹',
      // Cierre al Público (7-8)
      'Apagar luces todas menos blancas': '💡',
      'Meter carteles y cerrar puerta + persiana': '🚪',
      // Cierre Interno (9-15)
      'Limpiar con esponja lugar de cucharas ISA': '🧽',
      'Guardar smoothies en la nevera blanca': '❄️',
      'Tapar helados': '🍦',
      'Guardar helados repetidos al arcón': '📦',
      'Sacar pinchos de los helados': '🍢',
      'Sacar cucharas y pinchos a secar': '🍴',
      'Sacar basura': '🗑️',
      // Administrativo (16-17)
      'Apuntar info de cierre en libreta, imprimir y grapar': '📝',
      'Ingresar total de ventas del día': '💰',
      // Verificación (18)
      'Enviar foto de máquinas apagadas (gofre, aire, crepera, ventilador techo)': '📸',
      // Apagados Finales (19-20)
      'Apagar justeat y TPV': '🔌',
      'Apagar y cargar datafonos': '💳'
    }
    return icons[taskName] || '✅'
  }


  // Verificar si esta tarea requiere fotos específicas
  const requiresPhotos = task.requiereFotos === true
  const requiresInput = task.requiereInput === true

  // Si la tarea requiere fotos, mostrar el componente PhotoTask
  if (requiresPhotos) {
    return (
      <PhotoTask
        task={task}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onComplete={onComplete}
        onNext={onNext}
        cierreId={cierreId}
        trabajador={trabajador}
      />
    )
  }

  // Si la tarea requiere escaneo de ticket con IA (Bloque 5.2 mejorado)
  // Detectar por campo requiereEscaneo O por nombre de tarea (para cierres antiguos)
  const shouldUseScanner = requiresInput && task.inputType === 'ventas' && (
    task.requiereEscaneo === true ||
    (task.nombre && task.nombre.includes('Escanea el ticket'))
  )

  if (shouldUseScanner) {
    return (
      <TicketScannerTask
        task={task}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onComplete={onComplete}
        onNext={onNext}
        cierreId={cierreId}
        trabajador={trabajador}
      />
    )
  }

  // Si la tarea requiere input de ventas MANUAL (fallback o configuración antigua)
  if (requiresInput && task.inputType === 'ventas') {
    return (
      <VentasTask
        task={task}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onComplete={onComplete}
        onNext={onNext}
        cierreId={cierreId}
        trabajador={trabajador}
      />
    )
  }

  // Parsear subtareas si existen
  const subtareas = task.subtareas ? JSON.parse(task.subtareas) : null

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

        {/* Lista de Subtareas si existen */}
        {subtareas && subtareas.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-white/20">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 text-center">
              Tareas de este bloque:
            </h2>
            <ul className="space-y-3">
              {subtareas.map((subtarea, index) => (
                <li key={index} className="flex items-start gap-3 text-white/90 text-sm sm:text-base lg:text-lg">
                  <span className="text-green-400 flex-shrink-0 text-xl">✓</span>
                  <span>{subtarea}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
              <div className="w-full space-y-3">
                {/* Botón principal de completar */}
                <button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  ✅ OK
                </button>

              </div>
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
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="flex space-x-1 sm:space-x-2">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${index < currentStep - 1
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
