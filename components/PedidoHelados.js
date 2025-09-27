'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">¡Pedido Enviado!</h2>
          <p className="text-gray-600">Tu pedido de helados ha sido enviado correctamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🍦 Pedido de Helados</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Hola {user?.name}!</strong> Selecciona la cantidad de cada sabor de helado que necesitas.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Sabores Disponibles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {SABORES_DISPONIBLES.map(sabor => (
                  <div key={sabor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{sabor.emoji}</span>
                      <span className="font-medium text-gray-700 text-sm truncate">{sabor.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(sabor.id, (sabores[sabor.id] || 0) - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm"
                        disabled={(sabores[sabor.id] || 0) <= 0}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={sabores[sabor.id] || 0}
                        readOnly
                        className="w-12 text-center border border-gray-300 rounded px-1 py-1 text-gray-900 font-semibold bg-gray-50 text-sm cursor-default"
                      />
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(sabor.id, (sabores[sabor.id] || 0) + 1)}
                        className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Resumen del Pedido</h4>
              <div className="space-y-1">
                {getSaboresSeleccionados().map(sabor => (
                  <div key={sabor.id} className="flex justify-between text-sm">
                    <span className="text-gray-800">{sabor.nombre}</span>
                    <span className="font-medium text-gray-900">{sabores[sabor.id]} unidades</span>
                  </div>
                ))}
                {getTotalSabores() === 0 && (
                  <p className="text-gray-500 text-sm">No hay sabores seleccionados</p>
                )}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-gray-900">{getTotalSabores()} unidades</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Indicar si hace falta conos o no, preferencia de horario de entrega, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium bg-white"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={getTotalSabores() === 0 || isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
