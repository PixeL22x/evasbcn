'use client'

export default function CircularTimer({ 
  timeLeft, 
  totalTime, 
  isRunning, 
  onToggle, 
  isCompleted = false 
}) {
  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const circumference = 2 * Math.PI * 90 // radio de 90
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getColor = () => {
    if (isCompleted) return '#10B981' // verde
    if (progress > 80) return '#EF4444' // rojo
    if (progress > 60) return '#F59E0B' // amarillo
    return '#3B82F6' // azul
  }

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
      {/* Temporizador Circular Compacto */}
      <div className="relative">
        <svg className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 transform -rotate-90" viewBox="0 0 200 200">
          {/* Círculo de fondo */}
          <circle
            cx="100"
            cy="100"
            r="85"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="6"
            fill="none"
          />
          
          {/* Círculo de progreso */}
          <circle
            cx="100"
            cy="100"
            r="85"
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))'
            }}
          />
        </svg>
        
        {/* Tiempo en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xs sm:text-sm lg:text-lg font-mono font-bold ${
              isCompleted ? 'text-green-400' : 
              progress > 80 ? 'text-red-400' : 
              progress > 60 ? 'text-yellow-400' : 'text-white'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Información y controles */}
      <div className="flex-1 w-full sm:w-auto">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Tiempo restante</div>
            <div className={`text-sm sm:text-base lg:text-lg font-bold ${
              isCompleted ? 'text-green-400' : 
              progress > 80 ? 'text-red-400' : 
              progress > 60 ? 'text-yellow-400' : 'text-white'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs sm:text-sm text-white/60">Progreso</div>
            <div className="text-sm sm:text-base lg:text-lg font-bold text-white">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-2 sm:mb-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controles */}
        {!isCompleted && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onToggle}
              className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
            </button>
            
            <div className="text-xs text-white/60">
              {isRunning ? 'En progreso' : 'Pausado'}
            </div>
          </div>
        )}

        {/* Estado completado */}
        {isCompleted && (
          <div className="flex items-center space-x-2">
            <div className="text-green-400">✅</div>
            <span className="text-green-400 font-medium text-xs sm:text-sm">
              Tarea completada
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
