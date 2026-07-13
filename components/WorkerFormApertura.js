'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function WorkerFormApertura({ onStart, onCancel }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await fetch(`${window.location.origin}/api/apertura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trabajador: user.name,
          turno: 'mañana',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onStart(data.aperturaId, user.name, 'mañana')
      } else {
        const errorData = await response.json()
        console.error('Error al crear la apertura:', errorData)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/20">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <span className="text-4xl sm:text-5xl">🌅</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              ¡Buenos días, {user?.name}!
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Pulsa el botón para iniciar la apertura de la tienda
            </p>
          </div>

          {/* Botón de Inicio */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className={`w-full py-5 rounded-xl border-2 transition-all duration-300 mb-4 ${
              isLoading
                ? 'bg-gray-500/30 border-gray-400 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-white shadow-lg hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02] active:scale-[0.99]'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">
                {isLoading ? '⏳' : '🌅'}
              </div>
              <div className="text-lg font-bold">
                {isLoading ? 'Iniciando apertura...' : 'Empezar Apertura'}
              </div>
              {isLoading && (
                <div className="mt-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              )}
            </div>
          </button>

          {/* Botón Cancelar */}
          <div className="flex justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-300 border border-white/20 text-sm"
              disabled={isLoading}
            >
              ← Volver
            </button>
          </div>

          <div className="mt-5 text-center">
            <p className="text-white/40 text-xs">
              El sistema registrará tu nombre y la hora de inicio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

