'use client'

import { useState, useEffect } from 'react'

export default function EstadisticasPanel() {
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    fecha: '',
    trabajador: '',
    turno: ''
  })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async (filtrosAplicados = {}) => {
    try {
      const params = new URLSearchParams()
      if (filtrosAplicados.fecha) params.append('fecha', filtrosAplicados.fecha)
      if (filtrosAplicados.trabajador) params.append('trabajador', filtrosAplicados.trabajador)
      if (filtrosAplicados.turno) params.append('turno', filtrosAplicados.turno)

      const response = await fetch(`/api/estadisticas?${params}`)
      const data = await response.json()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    setLoading(true)
    cargarEstadisticas(filtros)
  }

  const enviarATelegram = async () => {
    setEnviando(true)
    try {
      const response = await fetch('/api/estadisticas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filtros)
      })

      const result = await response.json()
      
      if (result.success) {
        alert('✅ Estadísticas enviadas a Telegram!')
      } else {
        alert(`❌ Error: ${result.message}`)
      }
    } catch (error) {
      alert('❌ Error enviando estadísticas')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-6">
      <h3 className="text-xl font-bold text-white">📊 Estadísticas de Ventas</h3>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Fecha</label>
          <input
            type="date"
            value={filtros.fecha}
            onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value }))}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-1">Trabajador</label>
          <select
            value={filtros.trabajador}
            onChange={(e) => setFiltros(prev => ({ ...prev, trabajador: e.target.value }))}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            {estadisticas?.trabajadores?.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Turno</label>
          <select
            value={filtros.turno}
            onChange={(e) => setFiltros(prev => ({ ...prev, turno: e.target.value }))}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            {estadisticas?.turnos?.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end space-x-2">
          <button
            onClick={aplicarFiltros}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Filtrar
          </button>
          <button
            onClick={() => {
              setFiltros({ fecha: '', trabajador: '', turno: '' })
              cargarEstadisticas()
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-medium">Total Cierres</div>
          <div className="text-2xl font-bold text-white">{estadisticas?.totalCierres || 0}</div>
        </div>

        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <div className="text-green-400 text-sm font-medium">Completados</div>
          <div className="text-2xl font-bold text-white">{estadisticas?.cierresCompletados || 0}</div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="text-yellow-400 text-sm font-medium">Ventas Totales</div>
          <div className="text-2xl font-bold text-white">€{estadisticas?.totalVentas || 0}</div>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
          <div className="text-purple-400 text-sm font-medium">Promedio</div>
          <div className="text-2xl font-bold text-white">€{estadisticas?.promedioVentas || 0}</div>
        </div>
      </div>

      {/* Botón para enviar a Telegram */}
      <div className="flex justify-center">
        <button
          onClick={enviarATelegram}
          disabled={enviando || !estadisticas?.totalCierres}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
        >
          {enviando ? '⏳ Enviando...' : '📤 Enviar a Telegram'}
        </button>
      </div>

      {/* Lista de cierres recientes */}
      {estadisticas?.cierres && estadisticas.cierres.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">📋 Cierres Recientes</h4>
          <div className="space-y-2">
            {estadisticas.cierres.slice(0, 10).map(cierre => (
              <div key={cierre.id} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{cierre.trabajador}</div>
                  <div className="text-gray-400 text-sm">{cierre.turno} • {cierre.totalFotos} fotos</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">€{cierre.totalVentas || 0}</div>
                  <div className="text-gray-400 text-sm">
                    {new Date(cierre.fechaInicio).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
