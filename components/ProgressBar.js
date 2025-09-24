'use client'

import { useState, useEffect } from 'react'

export default function ProgressBar({ completed, total, showPercentage = true }) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  useEffect(() => {
    // Animar la barra de progreso
    const timer = setTimeout(() => {
      setAnimatedProgress(percentage)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [percentage])

  const getProgressColor = () => {
    if (percentage < 30) return 'from-red-400 to-red-500'
    if (percentage < 60) return 'from-yellow-400 to-orange-500'
    if (percentage < 90) return 'from-blue-400 to-blue-500'
    return 'from-green-400 to-green-500'
  }

  const getProgressMessage = () => {
    if (percentage === 0) return '¡Comienza el cierre! 🚀'
    if (percentage < 30) return '¡Vamos, que puedes! 💪'
    if (percentage < 60) return '¡Sigue así! 🔥'
    if (percentage < 90) return '¡Casi terminamos! ⚡'
    if (percentage < 100) return '¡Último esfuerzo! 🎯'
    return '¡Cierre completado! 🎉'
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Progreso del Cierre
        </h2>
        <p className="text-white/90 text-lg">
          {getProgressMessage()}
        </p>
      </div>

      <div className="progress-bar mb-4">
        <div 
          className={`progress-fill ${getProgressColor()}`}
          style={{ 
            width: `${animatedProgress}%`
          }}
        />
      </div>

      <div className="flex justify-between items-center text-white/90">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            Tareas completadas: {completed}/{total}
          </span>
        </div>
        
        {showPercentage && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {percentage}%
            </span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs font-bold">
                {percentage === 100 ? '🎉' : '📊'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Indicadores de progreso */}
      <div className="mt-4 flex justify-center space-x-2">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index < completed 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Mensaje motivacional */}
      {percentage > 0 && percentage < 100 && (
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm animate-pulse-slow">
            {completed === 1 && '¡Primera tarea completada! 🎊'}
            {completed === Math.floor(total / 2) && '¡Mitad del camino! 🏃‍♀️'}
            {completed === total - 1 && '¡Última tarea! 🏁'}
          </p>
        </div>
      )}
    </div>
  )
}
