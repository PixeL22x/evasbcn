'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function TemperaturaVitrina({ onClose }) {
  const { user } = useAuth()
  const [temperatura, setTemperatura] = useState('')
  const [vitrina, setVitrina] = useState('isa1')
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
          vitrina,
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
    return registrosHoy.some(reg => reg.hora === horaValue && reg.vitrina === vitrina)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 lg:p-8">
        <div className="w-full max-w-4xl bg-white sm:rounded-xl lg:rounded-2xl border-0 sm:border border-slate-200 shadow-xl relative min-h-screen sm:min-h-0">
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-4 sm:right-4 z-10 w-10 h-10 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 transition-all duration-300"
          >
            <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center mb-4 sm:mb-6 pt-20 sm:pt-4 pr-16 sm:pr-16 px-4 sm:px-0">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full mb-3 sm:mb-4 border border-blue-100 shadow-sm">
              <span className="text-2xl sm:text-3xl">🌡️</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-2">
              Registro de Temperatura - Vitrina
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Registra la temperatura de la vitrina de helados
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0 pb-4 sm:pb-0">
            
            {/* Formulario */}
            <div className="bg-slate-50/50 rounded-xl p-4 sm:p-6 border border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Nuevo Registro</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vitrina Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vitrina
                  </label>
                  <select
                    value={vitrina}
                    onChange={(e) => setVitrina(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    required
                  >
                    <option value="isa1">ISA 1</option>
                    <option value="isa2">ISA 2</option>
                  </select>
                </div>

                {/* Temperatura */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-25"
                    max="5"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="Ej: -15.5"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Rango permitido: -25°C a 5°C
                  </p>
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hora de Medición
                  </label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    required
                  >
                    <option value="" disabled>Selecciona una hora</option>
                    {horasPermitidas.map((h) => (
                      <option 
                        key={h.value} 
                        value={h.value} 
                        disabled={isHoraRegistrada(h.value)}
                        className={isHoraRegistrada(h.value) ? 'text-slate-400 bg-slate-50' : 'text-slate-800'}
                      >
                        {h.label} {isHoraRegistrada(h.value) ? '(Ya registrada)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm'
                    }`}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Registro'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 sm:px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all duration-300 border border-slate-200 shadow-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            </div>

            {/* Registros del día */}
            <div className="bg-slate-50/50 rounded-xl p-4 sm:p-6 border border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Registros de Hoy</h2>
              
              {registrosHoy.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-slate-500">No hay registros para hoy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrosHoy.map((registro) => (
                    <div key={registro.id} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTemperaturaIcon(registro.temperatura)}</span>
                          <span className="font-semibold text-slate-800">
                            {registro.vitrina === 'isa1' ? 'ISA 1' : 'ISA 2'} • {registro.hora}
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${getTemperaturaColor(registro.temperatura)}`}>
                          {registro.temperatura}°C
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-500 mt-2">
                        <p>Registrado: {new Date(registro.createdAt).toLocaleTimeString()}</p>
                        {registro.observaciones && (
                          <p className="mt-1 italic break-words text-slate-600">"{registro.observaciones}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-4 sm:mt-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 mx-4 sm:mx-0 mb-24 sm:mb-8">
            <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
              <span>📋</span> Instrucciones
            </h3>
            <ul className="text-blue-700/80 text-sm space-y-1">
              <li>• Registra la temperatura 3 veces al día: 14:00, 18:00 y 21:00</li>
              <li>• Se requieren lecturas tanto de ISA 1 como de ISA 2 (Total 6 registros)</li>
              <li>• La temperatura ideal para helados es entre -18°C y -10°C</li>
              <li>• Si la temperatura está fuera del rango seguro, contacta al supervisor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
