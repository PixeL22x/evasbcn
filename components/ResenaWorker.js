'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ResenaWorker({ onClose }) {
  const { user } = useAuth()
  const [calificacion, setCalificacion] = useState(0)
  const [fechaResena, setFechaResena] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resenasHoy, setResenasHoy] = useState([])

  // Cargar reseñas del día actual
  useEffect(() => {
    loadResenasHoy()
  }, [])

  const loadResenasHoy = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const response = await fetch(`${window.location.origin}/api/resenas?trabajadorId=${user.id}&fechaDesde=${hoy}&fechaHasta=${hoy}`)
      if (response.ok) {
        const data = await response.json()
        setResenasHoy(data.resenas || [])
      }
    } catch (error) {
      console.error('Error al cargar reseñas:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${window.location.origin}/api/resenas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trabajadorId: user.id,
          calificacion: calificacion,
          fechaResena: fechaResena
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Reseña registrada exitosamente')
        setCalificacion(0)
        setFechaResena(new Date().toISOString().split('T')[0])
        loadResenasHoy() // Recargar reseñas
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Error al guardar la reseña')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const getCalificacionColor = (cal) => {
    if (cal >= 4) return 'text-green-400'
    if (cal === 3) return 'text-yellow-400'
    return 'text-red-400'
  }

  const renderEstrellas = (calificacionSeleccionada) => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <button
            key={estrella}
            type="button"
            onClick={() => setCalificacion(estrella)}
            className={`text-4xl sm:text-5xl transition-all duration-200 transform hover:scale-110 ${
              estrella <= calificacionSeleccionada
                ? getCalificacionColor(estrella)
                : 'text-white/20'
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
    )
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
              <span className="text-2xl sm:text-3xl">⭐</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              Registrar Reseña de Google
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Registra las reseñas que recibes de los clientes
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0 pb-4 sm:pb-0">
            
            {/* Formulario */}
            <div className="bg-white/5 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Nueva Reseña</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Calificación */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4 text-center">
                    Calificación (Estrellas)
                  </label>
                  {renderEstrellas(calificacion)}
                  {calificacion > 0 && (
                    <p className={`text-center mt-2 text-sm font-medium ${getCalificacionColor(calificacion)}`}>
                      {calificacion} {calificacion === 1 ? 'estrella' : 'estrellas'}
                    </p>
                  )}
                </div>

                {/* Fecha de la reseña */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Fecha de la Reseña
                  </label>
                  <input
                    type="date"
                    value={fechaResena}
                    onChange={(e) => setFechaResena(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                  <p className="text-xs text-white/60 mt-1">
                    Selecciona la fecha en que se recibió la reseña
                  </p>
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
                    disabled={isLoading || calificacion === 0}
                    className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isLoading || calificacion === 0
                        ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                    }`}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Reseña'}
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

            {/* Reseñas del día */}
            <div className="bg-white/5 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Reseñas Registradas Hoy</h2>
              
              {resenasHoy.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-white/60">No hay reseñas registradas para hoy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resenasHoy.map((resena) => (
                    <div key={resena.id} className="bg-white/10 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((estrella) => (
                              <span
                                key={estrella}
                                className={`text-lg ${
                                  estrella <= resena.calificacion ? getCalificacionColor(resena.calificacion) : 'text-white/20'
                                }`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className={`text-lg font-bold ${getCalificacionColor(resena.calificacion)}`}>
                          {resena.calificacion} ⭐
                        </span>
                      </div>
                      
                      <div className="text-sm text-white/70">
                        <p>Fecha reseña: {new Date(resena.fechaResena).toLocaleDateString('es-ES')}</p>
                        <p>Registrado: {new Date(resena.fechaRegistro).toLocaleDateString('es-ES')}</p>
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
              <li>• Selecciona la calificación (1-5 estrellas) haciendo clic en las estrellas</li>
              <li>• Indica la fecha en que se recibió la reseña en Google</li>
              <li>• Puedes registrar múltiples reseñas del mismo día</li>
              <li>• Los administradores podrán ver todas las reseñas registradas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

