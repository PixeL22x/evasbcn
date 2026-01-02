'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Minus, Plus, X } from 'lucide-react'

const SABORES_DISPONIBLES = [
  // Sabores más populares primero
  { id: 'chocolate-belga', nombre: 'Chocolate Belga', emoji: '🍫' },
  { id: 'vainilla', nombre: 'Vainilla', emoji: '🍦' },
  { id: 'stracciatella', nombre: 'Stracciatella', emoji: '🍦' },
  { id: 'after-eight', nombre: 'After-Eight', emoji: '🍫' },
  { id: 'chocolate-kinder', nombre: 'Chocolate Kinder', emoji: '🍫' },
  { id: 'dulce-de-leche', nombre: 'Dulce de leche', emoji: '🥛' },
  { id: 'sorbete-fresa', nombre: 'Sorbete de fresa', emoji: '🍓' },
  { id: 'sorbete-mango', nombre: 'Sorbete de mango', emoji: '🥭' },
  // Resto de sabores
  { id: 'cafe', nombre: 'Café', emoji: '☕' },
  { id: 'coco', nombre: 'Coco', emoji: '🥥' },
  { id: 'crema-catalana', nombre: 'Crema catalana', emoji: '🍮' },
  { id: 'donut', nombre: 'Donut', emoji: '🍩' },
  { id: 'leche-merengada', nombre: 'Leche merengada', emoji: '🥛' },
  { id: 'nata', nombre: 'Nata', emoji: '🍦' },
  { id: 'orenata', nombre: 'Orenata', emoji: '🍊' },
  { id: 'cheesecake', nombre: 'Cheesecake', emoji: '🧀' },
  { id: 'pistacho', nombre: 'Pistacho', emoji: '🥜' },
  { id: 'speculoos', nombre: 'Speculoos', emoji: '🍪' },
  { id: 'tiramisu', nombre: 'Tiramisú', emoji: '🍰' },
  { id: 'vanilla-cookies', nombre: 'Vanilla Cookies', emoji: '🍪' },
  { id: 'yogur-frambuesa', nombre: 'Yogur de frambuesa', emoji: '🍓' },
  // Sorbetes al final
  { id: 'sorbete-limon', nombre: 'Sorbete de Limón', emoji: '🍋' },
  { id: 'sorbete-mandarina', nombre: 'Sorbete de mandarina', emoji: '🍊' },
  { id: 'sorbete-maracuya', nombre: 'Sorbete de maracuyá', emoji: '🥭' }
]

export default function PedidoHelados({ onClose }) {
  const { user } = useAuth()
  const [sabores, setSabores] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Inicializar sabores con cantidad 0
  useEffect(() => {
    const saboresIniciales = {}
    SABORES_DISPONIBLES.forEach(sabor => {
      saboresIniciales[sabor.id] = 0
    })
    setSabores(saboresIniciales)
  }, [])

  const handleCantidadChange = (saborId, cantidad) => {
    const nuevaCantidad = Math.max(0, parseInt(cantidad) || 0)
    setSabores(prev => ({
      ...prev,
      [saborId]: nuevaCantidad
    }))
  }

  const getTotalSabores = () => {
    return Object.values(sabores).reduce((total, cantidad) => total + cantidad, 0)
  }

  const getSaboresSeleccionados = () => {
    return SABORES_DISPONIBLES.filter(sabor => sabores[sabor.id] > 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (getTotalSabores() === 0) {
      alert('Debes seleccionar al menos un sabor de helado')
      return
    }

    setIsSubmitting(true)

    try {
      const saboresSeleccionados = getSaboresSeleccionados().map(sabor => ({
        sabor: sabor.nombre,
        cantidad: sabores[sabor.id],
        emoji: sabor.emoji
      }))

      const response = await fetch('/api/pedidos-helados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trabajadorId: user?.id,
          sabores: saboresSeleccionados,
          observaciones: observaciones.trim() || null
        }),
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error al crear pedido:', error)
      alert('Error al crear el pedido. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-center max-w-md w-full border border-white/10 shadow-2xl">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Pedido Enviado!</h2>
          <p className="text-white/70">Tu pedido de helados ha sido enviado correctamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600/20 to-orange-600/20 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🍦</div>
              <div>
                <h2 className="text-2xl font-bold text-white">Pedido de Helados</h2>
                <p className="text-white/60 text-sm">Hola {user?.name}! Selecciona los sabores</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sabores Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🍨</span>
                Sabores Disponibles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SABORES_DISPONIBLES.map(sabor => (
                  <div
                    key={sabor.id}
                    className={`
                      flex items-center justify-between p-3 rounded-xl
                      border transition-all duration-300
                      ${sabores[sabor.id] > 0
                        ? 'bg-gradient-to-br from-pink-600/20 to-orange-600/20 border-pink-500/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{sabor.emoji}</span>
                      <span className="font-medium text-white text-sm truncate">{sabor.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(sabor.id, (sabores[sabor.id] || 0) - 1)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                        disabled={(sabores[sabor.id] || 0) <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-12 text-center">
                        <span className="text-white font-bold text-lg">{sabores[sabor.id] || 0}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(sabor.id, (sabores[sabor.id] || 0) + 1)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>📋</span>
                Resumen del Pedido
              </h4>
              <div className="space-y-2">
                {getSaboresSeleccionados().map(sabor => (
                  <div key={sabor.id} className="flex justify-between text-sm">
                    <span className="text-white/80">{sabor.emoji} {sabor.nombre}</span>
                    <span className="font-medium text-white">{sabores[sabor.id]} unidades</span>
                  </div>
                ))}
                {getTotalSabores() === 0 && (
                  <p className="text-white/50 text-sm text-center py-2">No hay sabores seleccionados</p>
                )}
              </div>
              {getTotalSabores() > 0 && (
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-white">{getTotalSabores()} unidades</span>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Indicar si hace falta conos o no, preferencia de horario de entrega, etc."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 font-medium border border-white/10"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={getTotalSabores() === 0 || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
