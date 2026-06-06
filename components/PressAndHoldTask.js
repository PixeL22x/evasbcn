'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const HOLD_DURATION = 5000 // 5 segundos en ms

export default function PressAndHoldTask({
  task,
  currentStep,
  totalSteps,
  onComplete,
  onNext,
  cierreId,
  trabajador
}) {
  // Parsear la lista de máquinas desde subtareas (JSON string)
  const maquinas = (() => {
    try {
      if (task.subtareas) return JSON.parse(task.subtareas)
    } catch (_) {}
    return [{ id: 'maquina', nombre: task.nombre || 'Máquina' }]
  })()

  // Estado de cada máquina: null | 'holding' | 'done'
  const [estados, setEstados] = useState(() =>
    Object.fromEntries(maquinas.map(m => [m.id, { fase: 'idle', progreso: 0 }]))
  )
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Refs para gestionar los timers de cada botón
  const intervalRefs = useRef({})
  const startTimeRefs = useRef({})

  const allDone = maquinas.every(m => estados[m.id]?.fase === 'done')

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval)
    }
  }, [])

  const startHold = useCallback((id) => {
    if (estados[id]?.fase === 'done' || isCompleted) return

    startTimeRefs.current[id] = Date.now()

    // Vibrar al empezar (móvil)
    if (navigator.vibrate) navigator.vibrate(30)

    setEstados(prev => ({ ...prev, [id]: { fase: 'holding', progreso: 0 } }))

    intervalRefs.current[id] = setInterval(() => {
      const elapsed = Date.now() - startTimeRefs.current[id]
      const progreso = Math.min((elapsed / HOLD_DURATION) * 100, 100)

      if (progreso >= 100) {
        clearInterval(intervalRefs.current[id])
        if (navigator.vibrate) navigator.vibrate([80, 40, 80])
        setEstados(prev => ({ ...prev, [id]: { fase: 'done', progreso: 100 } }))
      } else {
        setEstados(prev => ({ ...prev, [id]: { fase: 'holding', progreso } }))
      }
    }, 50)
  }, [estados, isCompleted])

  const cancelHold = useCallback((id) => {
    if (estados[id]?.fase === 'done') return
    clearInterval(intervalRefs.current[id])
    setEstados(prev => ({ ...prev, [id]: { fase: 'idle', progreso: 0 } }))
  }, [estados])

  const handleConfirm = async () => {
    if (!allDone || isSaving || isCompleted) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/tarea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tareaId: task.id,
          completada: true,
          cierreId: cierreId,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      setIsCompleted(true)
      onComplete(task.id)
      setTimeout(() => onNext(), 1200)
    } catch (err) {
      console.error(err)
      alert('Error al confirmar. Inténtalo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const getProgressColor = (fase, progreso) => {
    if (fase === 'done') return '#10B981'   // verde
    if (progreso > 66) return '#F59E0B'    // naranja
    if (progreso > 33) return '#3B82F6'    // azul
    return '#6366F1'                        // índigo
  }

  const radius = 44
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-y-auto"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 pt-safe">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🧊</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">{task.nombre}</h1>
              <p className="text-xs text-white/60">Paso {currentStep} de {totalSteps}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/60 font-medium min-w-[3rem] text-right">
              {Math.round(((currentStep - 1) / totalSteps) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 py-6 pb-safe">
        <div className="max-w-md mx-auto space-y-5">

          {/* Instrucción */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-center">
            <p className="text-indigo-300 text-sm font-medium">
              👇 Mantén pulsado <span className="text-white font-bold">5 segundos</span> para confirmar que cada máquina está apagada
            </p>
          </div>

          {/* Botones de máquinas */}
          <div className="space-y-3">
            {maquinas.map((maquina) => {
              const estado = estados[maquina.id] || { fase: 'idle', progreso: 0 }
              const isDone = estado.fase === 'done'
              const isHolding = estado.fase === 'holding'
              const progreso = estado.progreso
              const color = getProgressColor(estado.fase, progreso)
              const strokeDashoffset = circumference - (progreso / 100) * circumference

              return (
                <div
                  key={maquina.id}
                  className={`
                    relative rounded-2xl border-2 transition-all duration-300 overflow-hidden select-none
                    ${isDone
                      ? 'bg-green-500/15 border-green-500/50'
                      : isHolding
                        ? 'bg-indigo-500/15 border-indigo-400/60 shadow-lg shadow-indigo-500/20'
                        : 'bg-white/5 border-white/15'
                    }
                  `}
                  onMouseDown={() => startHold(maquina.id)}
                  onMouseUp={() => cancelHold(maquina.id)}
                  onMouseLeave={() => cancelHold(maquina.id)}
                  onTouchStart={(e) => { e.preventDefault(); startHold(maquina.id) }}
                  onTouchEnd={(e) => { e.preventDefault(); cancelHold(maquina.id) }}
                  onTouchCancel={(e) => { e.preventDefault(); cancelHold(maquina.id) }}
                  style={{ cursor: isDone ? 'default' : 'pointer', WebkitUserSelect: 'none' }}
                >
                  {/* Barra de fondo animada mientras se mantiene */}
                  {isHolding && (
                    <div
                      className="absolute inset-0 bg-indigo-400/10 transition-none"
                      style={{ width: `${progreso}%` }}
                    />
                  )}

                  <div className="relative flex items-center gap-4 px-4 py-4">
                    {/* Círculo de progreso SVG */}
                    <div className="relative flex-shrink-0 w-14 h-14">
                      <svg
                        className="w-14 h-14 -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        {/* Track */}
                        <circle
                          cx="50" cy="50" r={radius}
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="6"
                          fill="none"
                        />
                        {/* Progreso */}
                        <circle
                          cx="50" cy="50" r={radius}
                          stroke={color}
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={isDone ? 0 : strokeDashoffset}
                          style={{
                            transition: isDone ? 'stroke-dashoffset 0.3s ease' : 'none',
                            filter: `drop-shadow(0 0 6px ${color}88)`
                          }}
                        />
                      </svg>
                      {/* Icono central */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl">
                          {isDone ? '✅' : isHolding ? '⏳' : '⭕'}
                        </span>
                      </div>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base leading-tight ${isDone ? 'text-green-300' : 'text-white'}`}>
                        {maquina.nombre}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDone ? 'text-green-400' : isHolding ? 'text-indigo-300' : 'text-white/50'}`}>
                        {isDone
                          ? '✓ Confirmado'
                          : isHolding
                            ? `${Math.round(progreso / 20) * 1}s... mantén pulsado`
                            : 'Mantén pulsado 5 segundos'}
                      </p>
                    </div>

                    {/* Badge estado */}
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0
                      ${isDone ? 'bg-green-500/25 text-green-400' : isHolding ? 'bg-indigo-500/25 text-indigo-300' : 'bg-white/10 text-white/40'}
                    `}>
                      {isDone ? 'OK' : isHolding ? `${Math.round(progreso)}%` : '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contador de progreso */}
          <div className="flex items-center justify-center gap-2">
            {maquinas.map((m) => (
              <div
                key={m.id}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  estados[m.id]?.fase === 'done' ? 'bg-green-400 scale-110' : 'bg-white/20'
                }`}
              />
            ))}
            <span className="text-xs text-white/50 ml-2">
              {maquinas.filter(m => estados[m.id]?.fase === 'done').length} / {maquinas.length}
            </span>
          </div>

          {/* Botón de confirmar – aparece solo cuando todo está OK */}
          <div
            className={`transition-all duration-500 ${allDone && !isCompleted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          >
            <button
              id="btn-confirmar-apagado"
              onClick={handleConfirm}
              disabled={!allDone || isSaving}
              className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-green-500/30 transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                '✅ Confirmar apagado'
              )}
            </button>
          </div>

          {/* Éxito */}
          {isCompleted && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-green-400 text-lg font-bold">¡Apagado confirmado!</p>
              <p className="text-green-300/70 text-sm mt-1">Avanzando...</p>
            </div>
          )}

          {/* Dots de navegación */}
          <div className="flex items-center justify-center gap-1.5 py-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i < currentStep - 1
                    ? 'w-2 h-2 bg-green-400'
                    : i === currentStep - 1
                      ? 'w-6 h-2 bg-indigo-400'
                      : 'w-2 h-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
