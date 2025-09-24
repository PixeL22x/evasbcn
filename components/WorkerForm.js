'use client'

import { useState } from 'react'

const trabajadores = [
  { id: 'julia', nombre: 'Julia', emoji: '👩‍💼' },
  { id: 'alejandra', nombre: 'Alejandra', emoji: '👩‍🍳' },
  { id: 'martina', nombre: 'Martina', emoji: '👩‍💻' }
]

export default function WorkerForm({ onStart, onCancel }) {
  const [selectedWorker, setSelectedWorker] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleWorkerSelect = async (worker) => {
    if (isLoading) return
    
    setSelectedWorker(worker.id)
    setIsLoading(true)
    
    try {
      // Crear el cierre en la base de datos
      const response = await fetch('/api/cierre', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trabajador: worker.nombre,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onStart(data.cierreId, worker.nombre)
      } else {
        console.error('Error al crear el cierre')
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
              <span className="text-2xl sm:text-3xl lg:text-4xl">👥</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              ¿Quién eres?
            </h1>
            <p className="text-white/70 text-sm sm:text-base lg:text-lg">
              Selecciona tu nombre para iniciar el cierre
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            {trabajadores.map((worker) => (
              <button
                key={worker.id}
                onClick={() => handleWorkerSelect(worker)}
                disabled={isLoading}
                className={`p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedWorker === worker.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2 lg:mb-3">{worker.emoji}</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold">{worker.nombre}</div>
                  {selectedWorker === worker.id && isLoading && (
                    <div className="mt-1 sm:mt-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
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
