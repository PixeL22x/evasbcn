'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function WorkerForm({ onStart, onCancel }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTurno, setSelectedTurno] = useState('')

  const handleStart = async () => {
    if (isLoading || !selectedTurno) return
    
    setIsLoading(true)
    
    try {
      // Crear el cierre en la base de datos
      const response = await fetch(`${window.location.origin}/api/cierre`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trabajador: user.name,
          turno: selectedTurno,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onStart(data.cierreId, user.name, selectedTurno)
      } else {
        const errorData = await response.json()
        console.error('Error al crear el cierre:', errorData)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 lg:mb-6">
              <span className="text-2xl sm:text-3xl lg:text-4xl">🍦</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              ¡Hola {user?.name}!
            </h1>
            <p className="text-white/70 text-sm sm:text-base lg:text-lg">
              Selecciona tu turno para iniciar el cierre de tienda
            </p>
          </div>

          {/* Selección de Turno */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Turno Mañana */}
              <button
                onClick={() => setSelectedTurno('mañana')}
                className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedTurno === 'mañana'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-600 border-orange-400 text-white shadow-lg'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🌅</div>
                  <div className="text-lg sm:text-xl font-bold mb-1">Turno Mañana</div>
                </div>
              </button>

              {/* Turno Tarde */}
              <button
                onClick={() => setSelectedTurno('tarde')}
                className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedTurno === 'tarde'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-400 text-white shadow-lg'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🌆</div>
                  <div className="text-lg sm:text-xl font-bold mb-1">Turno Tarde</div>
                </div>
              </button>
            </div>
          </div>

          {/* Botón de Inicio */}
          <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8">
            <button
              onClick={handleStart}
              disabled={isLoading || !selectedTurno}
              className={`px-8 sm:px-12 lg:px-16 py-4 sm:py-6 lg:py-8 rounded-lg sm:rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                isLoading || !selectedTurno
                  ? 'bg-gray-500/30 border-gray-400 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 text-white shadow-lg hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">🚀</div>
                <div className="text-base sm:text-lg lg:text-xl font-bold">
                  {isLoading ? 'Iniciando...' : `Empezar Cierre ${selectedTurno ? `- ${selectedTurno.charAt(0).toUpperCase() + selectedTurno.slice(1)}` : ''}`}
                </div>
                {isLoading && (
                  <div className="mt-2 sm:mt-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                )}
              </div>
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onCancel}
              className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-300 border border-white/20 text-xs sm:text-sm lg:text-base"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>

          <div className="mt-3 sm:mt-4 lg:mt-6 text-center">
            <p className="text-white/60 text-xs sm:text-sm">
              El sistema registrará tu nombre y la hora de inicio del cierre
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
