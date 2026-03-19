'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Config ─────────────────────────────────────────────────────────────────
const PRIORIDADES = {
  urgente: { label: '🔴 Urgente',  cls: 'bg-red-500/15 text-red-700 border-red-500/20' },
  alta:    { label: '🟠 Alta',     cls: 'bg-orange-500/15 text-orange-700 border-orange-500/20' },
  normal:  { label: '🟡 Normal',   cls: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/20' },
  baja:    { label: '⚪ Baja',     cls: 'bg-slate-500/15 text-slate-600 border-slate-500/20' },
}
const CAT_EMOJI = {
  limpieza: '🧹', mantenimiento: '🔧', reposicion: '📦', higiene: '🧼', otro: '📋'
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function isVencida(t) {
  return t.fechaLimite && new Date(t.fechaLimite) < new Date()
}

// ─── Complete dialog ─────────────────────────────────────────────────────────
function CompleteDialog({ tarea, onConfirm, onCancel }) {
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    await onConfirm(tarea.id, nota)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-bold text-lg">Completar tarea</h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">{tarea.titulo}</p>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Nota (opcional)
          </label>
          <textarea
            value={nota} onChange={e => setNota(e.target.value)}
            rows={2} placeholder="Ej: Terminé a las 18:30, todo en orden…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors">
            {saving ? 'Guardando…' : '✓ Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function MisTareas({ trabajadorId, onClose }) {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null) // tarea siendo completada

  const fetchTareas = useCallback(async () => {
    if (!trabajadorId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/tareas-asignadas?trabajadorId=${trabajadorId}&estado=pendiente`)
      if (r.ok) setTareas(await r.json())
    } finally { setLoading(false) }
  }, [trabajadorId])

  useEffect(() => { fetchTareas() }, [fetchTareas])

  const handleComplete = async (id, nota) => {
    const r = await fetch(`/api/tareas-asignadas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'completada', notasWorker: nota || null })
    })
    if (r.ok) {
      setCompleting(null)
      // Animación optimista: remover de la lista
      setTareas(prev => prev.filter(t => t.id !== id))
    }
  }

  // Sort: urgente/alta primero, luego vencidas
  const sorted = [...tareas].sort((a, b) => {
    const ORDEN = { urgente: 0, alta: 1, normal: 2, baja: 3 }
    return (ORDEN[a.prioridad] ?? 2) - (ORDEN[b.prioridad] ?? 2)
  })

  return (
    <>
      {/* Sheet */}
      <div className="fixed inset-0 z-[100] flex items-end justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        <div className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-lg shadow-2xl"
          style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold">📋 Mis tareas</h2>
              <p className="text-xs text-gray-500">
                {loading ? 'Cargando…' : `${tareas.length} pendiente${tareas.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : sorted.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🎉</div>
                <p className="font-semibold text-gray-800">¡Sin tareas pendientes!</p>
                <p className="text-sm text-gray-500 mt-1">Estás al día con todo.</p>
              </div>
            ) : (
              sorted.map(tarea => {
                const prio = PRIORIDADES[tarea.prioridad] ?? PRIORIDADES.normal
                const vencida = isVencida(tarea)

                return (
                  <div key={tarea.id}
                    className={`rounded-2xl border p-4 ${vencida ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                        {CAT_EMOJI[tarea.categoria] ?? '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
                          {tarea.titulo}
                        </p>
                        {tarea.descripcion && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tarea.descripcion}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${prio.cls}`}>
                            {prio.label}
                          </span>
                          {tarea.fechaLimite && (
                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${
                              vencida ? 'bg-red-500/15 text-red-700 border-red-500/20 font-bold' : 'text-gray-500 border-gray-200'
                            }`}>
                              📅 {fmtDate(tarea.fechaLimite)}{vencida ? ' ⚠️' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Complete button */}
                    <button
                      onClick={() => setCompleting(tarea)}
                      className="mt-3 w-full py-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold border border-green-200 transition-colors active:scale-[0.98]">
                      ✓ Marcar como completada
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Safe area bottom */}
          <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }} />
        </div>
      </div>

      {/* Complete confirmation */}
      {completing && (
        <CompleteDialog
          tarea={completing}
          onConfirm={handleComplete}
          onCancel={() => setCompleting(null)}
        />
      )}
    </>
  )
}
