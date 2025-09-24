'use client'

import { useState, useEffect } from 'react'

export default function TaskCard({ task, onToggle, showTimer = false }) {
  const [timeLeft, setTimeLeft] = useState(task.duration * 60) // Convertir minutos a segundos
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(task.completed)

  useEffect(() => {
    let interval = null
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      // Auto-completar cuando el temporizador llega a 0
      handleToggle()
    }
    
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const handleToggle = () => {
    setIsCompleted(!isCompleted)
    onToggle(task.id)
    setIsRunning(false)
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
      'Limpiar mostrador': '🧽',
      'Guardar productos en la cámara': '❄️',
      'Apagar máquinas': '🔌',
      'Contar caja': '💰',
      'Registrar ventas en el sistema': '💻',
      'Limpiar piso y sacar basura': '🗑️'
    }
    return icons[taskName] || '✅'
  }

  return (
    <div className={`task-card ${isCompleted ? 'completed' : 'pending'} animate-slide-in`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getTaskIcon(task.name)}</span>
          <div>
            <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
              {task.name}
            </h3>
            <p className={`text-sm ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
              Tiempo estimado: {task.duration} minutos
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isCompleted 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
          }`}
        >
          {isCompleted ? '✓' : '○'}
        </button>
      </div>

      {showTimer && !isCompleted && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Temporizador:</span>
            <span className={`text-lg font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-700'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="h-2 bg-gradient-to-r from-evas-pink to-evas-purple rounded-full transition-all duration-1000"
              style={{ width: `${((task.duration * 60 - timeLeft) / (task.duration * 60)) * 100}%` }}
            />
          </div>
          
          <button
            onClick={handleStartTimer}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
              isRunning 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-evas-blue text-white hover:bg-blue-600'
            }`}
          >
            {isRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
          <span className="text-green-700 font-medium">¡Tarea completada! 🎉</span>
        </div>
      )}
    </div>
  )
}
