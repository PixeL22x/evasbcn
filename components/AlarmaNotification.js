'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check } from 'lucide-react'

// ─── Web Audio API sounds ─────────────────────────────────────────────────
function playSound(tipo, audioCtx) {
  if (!audioCtx || audioCtx.state === 'closed') return
  const sequences = {
    beep:    [{ f:880,t:0,d:.12},{f:880,t:.18,d:.12},{f:1100,t:.36,d:.28}],
    campana: [{ f:523,t:0,d:.9 },{f:659,t:.08,d:.7},{f:784,t:.18,d:1.1}],
    alerta:  [{ f:440,t:0,d:.09},{f:880,t:.13,d:.09},{f:440,t:.26,d:.09},{f:880,t:.39,d:.09},{f:1320,t:.54,d:.38}],
  }
  const notes = sequences[tipo] || sequences.beep
  const now   = audioCtx.currentTime
  notes.forEach(({ f, t, d }) => {
    try {
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain()
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.type = tipo === 'campana' ? 'sine' : 'square'
      osc.frequency.setValueAtTime(f, now + t)
      gain.gain.setValueAtTime(0.35, now + t)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d)
      osc.start(now + t); osc.stop(now + t + d + .05)
    } catch (_) {}
  })
}

// ─── iOS-style accent colors per alarm color ──────────────────────────────
const ACCENT = {
  rojo:    { color: '#ef4444', light: '#fee2e2', btnText: '#dc2626' },
  naranja: { color: '#f97316', light: '#fff7ed', btnText: '#ea580c' },
  azul:    { color: '#3b82f6', light: '#eff6ff', btnText: '#2563eb' },
  verde:   { color: '#22c55e', light: '#f0fdf4', btnText: '#16a34a' },
}

// ─── Worker alarm modal — iOS Alert / Action Sheet style ──────────────────
function AlarmaModal({ alarma, onDescartar, audioCtxRef }) {
  const accent       = ACCENT[alarma.color] || ACCENT.naranja
  const intervalRef  = useRef(null)
  const [dismissed,  setDismissed]  = useState(false)
  const [countdown,  setCountdown]  = useState(8)

  const doPlay = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().then(() => playSound(alarma.sonido, ctx))
    else playSound(alarma.sonido, ctx)
  }, [alarma.sonido, audioCtxRef])

  useEffect(() => {
    doPlay()
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600])

    // Ring every 8s
    intervalRef.current = setInterval(() => {
      doPlay()
      if (navigator.vibrate) navigator.vibrate([200, 80, 200])
      setCountdown(8)
    }, 8000)

    // Countdown tick
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)

    return () => { clearInterval(intervalRef.current); clearInterval(tick) }
  }, [doPlay])

  const confirm = async () => {
    setDismissed(true)
    clearInterval(intervalRef.current)
    await onDescartar(alarma.id)
  }

  if (dismissed) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* iOS alert card */}
      <div className="w-full sm:w-80 bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl">

        {/* Handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Icon + header */}
        <div className="px-6 pt-6 pb-4 text-center space-y-3">
          {/* Bell icon with color accent */}
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-1"
            style={{ backgroundColor: accent.light }}>
            <Bell
              className="w-8 h-8"
              style={{ color: accent.color, animation: 'ring 0.6s ease-in-out infinite' }}
            />
          </div>

          {/* Time */}
          <p className="text-4xl font-black font-mono" style={{ color: accent.color }}>
            {alarma.hora}
          </p>

          {/* Title */}
          <p className="text-base font-semibold text-gray-900 leading-snug">{alarma.titulo}</p>

          {/* Description */}
          {alarma.descripcion && (
            <p className="text-sm text-gray-500 leading-relaxed">{alarma.descripcion}</p>
          )}

          {/* Countdown bar */}
          <div className="mt-2">
            <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 8) * 100}%`, backgroundColor: accent.color }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Próximo aviso en {countdown}s</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* iOS-style confirm button */}
        <button
          onClick={confirm}
          className="w-full py-4 flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
        >
          <Check className="w-5 h-5" style={{ color: accent.color }} strokeWidth={2.5} />
          <span className="text-base font-bold" style={{ color: accent.color }}>Entendido</span>
        </button>

        {/* Bottom safe area */}
        <div className="h-safe-area-bottom sm:h-0 bg-white pb-2 sm:pb-0" />
      </div>

      {/* CSS bell animation */}
      <style>{`
        @keyframes ring {
          0%,100%{ transform:rotate(0deg) }
          10%     { transform:rotate(14deg) }
          30%     { transform:rotate(-14deg) }
          50%     { transform:rotate(10deg) }
          70%     { transform:rotate(-10deg) }
          90%     { transform:rotate(4deg) }
        }
      `}</style>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────
export default function AlarmaNotification({ trabajadorNombre, trabajadorId }) {
  const [alarmasActivas, setAlarmasActivas] = useState([])
  const [notificadoHoy,  setNotificadoHoy]  = useState(new Set())
  const pollingRef  = useRef(null)
  const audioCtxRef = useRef(null)

  // Pre-warm AudioContext on first user interaction
  useEffect(() => {
    const warmUp = () => {
      try {
        if (!audioCtxRef.current)
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
      } catch (_) {}
      document.removeEventListener('click',      warmUp)
      document.removeEventListener('touchstart', warmUp)
      document.removeEventListener('keydown',    warmUp)
    }
    document.addEventListener('click',      warmUp)
    document.addEventListener('touchstart', warmUp)
    document.addEventListener('keydown',    warmUp)
    return () => {
      document.removeEventListener('click',      warmUp)
      document.removeEventListener('touchstart', warmUp)
      document.removeEventListener('keydown',    warmUp)
    }
  }, [])

  const checkAlarmas = useCallback(async () => {
    if (!trabajadorNombre) return
    try {
      const res = await fetch(
        `/api/alarmas/check?trabajador=${encodeURIComponent(trabajadorNombre)}`,
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const { alarmas } = await res.json()
      if (!alarmas?.length) return
      const nuevas = alarmas.filter(a => !notificadoHoy.has(a.id))
      if (!nuevas.length) return
      setAlarmasActivas(prev => {
        const ids = new Set(prev.map(a => a.id))
        return [...prev, ...nuevas.filter(a => !ids.has(a.id))]
      })
      setNotificadoHoy(prev => { const n = new Set(prev); nuevas.forEach(a => n.add(a.id)); return n })
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') Notification.requestPermission()
        if (Notification.permission === 'granted')
          nuevas.forEach(a => { try { new Notification(`🔔 ${a.titulo}`, { body: a.descripcion || `Alarma · ${a.hora}`, icon: '/icon.png' }) } catch (_) {} })
      }
    } catch (_) {}
  }, [trabajadorNombre, notificadoHoy])

  useEffect(() => {
    if (!trabajadorNombre) return
    checkAlarmas()
    pollingRef.current = setInterval(checkAlarmas, 30_000)
    return () => clearInterval(pollingRef.current)
  }, [trabajadorNombre]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDescartar = async (alarmaId) => {
    try {
      await fetch('/api/alarmas/disparar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarmaId, trabajadorNombre, trabajadorId: trabajadorId || null, descartada: true }),
      })
    } catch (_) {}
    setAlarmasActivas(prev => prev.filter(a => a.id !== alarmaId))
  }

  if (!alarmasActivas.length) return null

  return (
    <AlarmaModal
      key={alarmasActivas[0].id}
      alarma={alarmasActivas[0]}
      onDescartar={handleDescartar}
      audioCtxRef={audioCtxRef}
    />
  )
}
