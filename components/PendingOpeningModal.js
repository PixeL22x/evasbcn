'use client'

import { useEffect } from 'react'

export default function PendingOpeningModal({
  isOpen,
  onClose,
  onContinue,
  onNewOpening,
  aperturaData
}) {
  if (!isOpen || !aperturaData) return null

  const { turno, fechaInicio, tareasCompletadas, totalTareas, progreso } = aperturaData

  const fecha = new Date(fechaInicio)
  const fechaFormateada = fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  const horaFormateada = fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const tiempoTranscurrido = Math.floor((Date.now() - fecha.getTime()) / 1000 / 60)
  const horas = Math.floor(tiempoTranscurrido / 60)
  const minutos = tiempoTranscurrido % 60
  const tiempoTexto = horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <span className="text-2xl">🌅</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Apertura Pendiente
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Continúa donde lo dejaste
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span>📅</span>
              <span className="text-sm">
                <span className="font-medium">Apertura turno {turno?.toUpperCase()}</span> • {fechaFormateada}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span>⏰</span>
              <span className="text-sm">
                Iniciada a las {horaFormateada} • Hace {tiempoTexto}
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Progreso</span>
              <span className="text-slate-500 dark:text-slate-400">
                {tareasCompletadas} de {totalTareas} pasos
              </span>
            </div>
            <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <span>☀️</span>
              <span>{progreso}% completado</span>
            </div>
          </div>

          {/* Mensaje */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              💪 ¡Vas por buen camino! Solo te quedan <strong>{totalTareas - tareasCompletadas}</strong> pasos por completar.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={onContinue}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>▶</span>
            Continuar Apertura
          </button>
          <button
            onClick={onNewOpening}
            className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all duration-200"
          >
            Iniciar Nueva Apertura
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
