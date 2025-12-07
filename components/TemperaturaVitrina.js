'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function TemperaturaVitrina({ onClose }) {
  const { user } = useAuth()
  const [temperatura, setTemperatura] = useState('')
  const [hora, setHora] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [registrosHoy, setRegistrosHoy] = useState([])

  const horasPermitidas = [
    { value: '14:00', label: '14:00 - Mediodía' },
    { value: '18:00', label: '18:00 - Tarde' },
    { value: '21:00', label: '21:00 - Noche' }
  ]

  // Cargar registros del día actual
  useEffect(() => {
    loadRegistrosHoy()
  }, [])

  const loadRegistrosHoy = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/temperatura?hoy=true&trabajadorId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setRegistrosHoy(data.registros)
      }
    } catch (error) {
      console.error('Error al cargar registros:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${window.location.origin}/api/temperatura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trabajadorId: user.id,
          temperatura: parseFloat(temperatura),
          hora,
          observaciones: observaciones.trim() || null
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registro de temperatura guardado exitosamente')
        setTemperatura('')
        setHora('')
        setObservaciones('')
        loadRegistrosHoy() // Recargar registros
      } else {
        setError(data.error || 'Error al guardar el registro')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const getTemperaturaColor = (temp) => {
    if (temp < -18) return 'text-blue-600' // Muy frío
    if (temp < -10) return 'text-green-600' // Ideal
    if (temp < -2) return 'text-yellow-600' // Aceptable
    return 'text-red-600' // Peligroso
  }

  const getTemperaturaIcon = (temp) => {
    if (temp < -18) return '🥶'
    if (temp < -10) return '❄️'
    if (temp < -2) return '⚠️'
    return '🔥'
  }

  const isHoraRegistrada = (horaValue) => {
    return registrosHoy.some(reg => reg.hora === horaValue)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 lg:p-8">
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-none sm:rounded-xl lg:rounded-2xl border-0 sm:border border-white/20 relative min-h-screen sm:min-h-0">
          
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-4 sm:right-4 z-10 w-10 h-10 sm:w-10 sm:h-10 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg"
          >
            <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 pt-20 sm:pt-4 pr-16 sm:pr-16 px-4 sm:px-0">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🌡️</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              Registro de Temperatura - Vitrina
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Registra la temperatura de la vitrina de helados
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0 pb-4 sm:pb-0">
            
            {/* Formulario */}
            <div className="bg-white/5 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Nuevo Registro</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Temperatura */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-25"
                    max="5"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: -15.5"
                    required
                  />
                  <p className="text-xs text-white/60 mt-1">
                    Rango permitido: -25°C a 5°C
                  </p>
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Hora de Medición
                  </label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ colorScheme: 'dark' }}
                    required
                  >
                    <option value="" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Selecciona una hora</option>
                    {horasPermitidas.map((h) => (
                      <option 
                        key={h.value} 
                        value={h.value} 
                        disabled={isHoraRegistrada(h.value)}
                        style={{ 
                          backgroundColor: isHoraRegistrada(h.value) ? '#374151' : '#1e293b', 
                          color: isHoraRegistrada(h.value) ? '#9ca3af' : '#ffffff' 
                        }}
                      >
                        {h.label} {isHoraRegistrada(h.value) ? '(Ya registrada)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notas adicionales sobre la medición..."
                    rows="3"
                  />
                </div>

                {/* Mensajes */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-200 text-sm">{success}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !temperatura || !hora}
                    className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isLoading || !temperatura || !hora
                        ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                    }`}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Registro'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 sm:px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-300 border border-white/20"
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            </div>

            {/* Registros del día */}
            <div className="bg-white/5 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Registros de Hoy</h2>
              
              {registrosHoy.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-white/60">No hay registros para hoy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrosHoy.map((registro) => (
                    <div key={registro.id} className="bg-white/10 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTemperaturaIcon(registro.temperatura)}</span>
                          <span className="font-semibold text-white">{registro.hora}</span>
                        </div>
                        <span className={`text-lg font-bold ${getTemperaturaColor(registro.temperatura)}`}>
                          {registro.temperatura}°C
                        </span>
                      </div>
                      
                      <div className="text-sm text-white/70">
                        <p>Registrado: {new Date(registro.createdAt).toLocaleTimeString()}</p>
                        {registro.observaciones && (
                          <p className="mt-1 italic break-words">"{registro.observaciones}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-4 sm:mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 mx-4 sm:mx-0 mb-4 sm:mb-0">
            <h3 className="text-blue-200 font-semibold mb-2">📋 Instrucciones</h3>
            <ul className="text-blue-200/80 text-sm space-y-1">
              <li>• Registra la temperatura 3 veces al día: 14:00, 18:00 y 21:00</li>
              <li>• La temperatura ideal para helados es entre -18°C y -10°C</li>
              <li>• Si la temperatura está fuera del rango seguro, contacta al supervisor</li>
              <li>• Solo puedes registrar cada hora una vez por día</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
