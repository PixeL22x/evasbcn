'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

function AdminPageContent() {
  const [cierres, setCierres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    loadCierres()
  }, [])

  const loadCierres = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cierre')
      if (response.ok) {
        const data = await response.json()
        setCierres(data.cierres)
      } else {
        setError('Error al cargar los cierres')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar los cierres')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCierre = async (cierreId) => {
    try {
      setDeletingId(cierreId)
      const response = await fetch('/api/cierre', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cierreId }),
      })

      if (response.ok) {
        // Actualizar la lista de cierres
        setCierres(prevCierres => prevCierres.filter(cierre => cierre.id !== cierreId))
        setShowDeleteConfirm(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Error al eliminar el cierre')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al eliminar el cierre')
    } finally {
      setDeletingId(null)
    }
  }

  const confirmDelete = (cierreId) => {
    setShowDeleteConfirm(cierreId)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (startDate, endDate) => {
    if (!endDate) return 'En progreso'
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end - start
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`
    }
    return `${diffSecs}s`
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `hace ${diffDays}d`
    if (diffHours > 0) return `hace ${diffHours}h`
    if (diffMins > 0) return `hace ${diffMins}m`
    return 'ahora'
  }

  const getStatusColor = (completado) => {
    return completado 
      ? 'bg-green-500/20 text-green-300 border-green-400/30' 
      : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
  }

  const getStatusText = (completado) => {
    return completado ? 'Completado' : 'En Progreso'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Cargando cierres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                📊 Estadísticas
              </h1>
              <p className="text-white/70 text-sm sm:text-base lg:text-lg">
                Historial de cierres de Evas Barcelona
              </p>
            </div>
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              ← Volver al Inicio
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {cierres.length}
            </div>
            <div className="text-white/70 text-sm sm:text-base">Total de Cierres</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1 sm:mb-2">
              {cierres.filter(c => c.completado).length}
            </div>
            <div className="text-white/70 text-sm sm:text-base">Completados</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1 sm:mb-2">
              {cierres.filter(c => !c.completado).length}
            </div>
            <div className="text-white/70 text-sm sm:text-base">En Progreso</div>
          </div>
        </div>

        {/* Lista de Cierres */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-white/20">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
            Historial de Cierres
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {cierres.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📊</div>
              <p className="text-white/70 text-base sm:text-lg">
                No hay cierres registrados aún
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cierres.map((cierre) => (
                <div
                  key={cierre.id}
                  className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                        {cierre.trabajador}
                      </h3>
                      <p className="text-white/70 text-sm sm:text-base">
                        {formatDate(cierre.fechaInicio)} • {getTimeAgo(cierre.fechaInicio)}
                      </p>
                      {cierre.fechaFin && (
                        <p className="text-white/70 text-sm sm:text-base">
                          Duración: {formatDuration(cierre.fechaInicio, cierre.fechaFin)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg border text-xs sm:text-sm ${getStatusColor(cierre.completado)}`}>
                        {getStatusText(cierre.completado)}
                      </div>
                      <button
                        onClick={() => confirmDelete(cierre.id)}
                        disabled={deletingId === cierre.id}
                        className="px-2 sm:px-3 py-1 sm:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg border border-red-400/30 hover:border-red-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title="Eliminar cierre"
                      >
                        {deletingId === cierre.id ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progreso de Tareas Simplificado */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm text-white/60 mb-1 sm:mb-2">
                      <span>Progreso del Cierre</span>
                      <span>
                        {cierre.tareas.filter(t => t.completada).length} / {cierre.tareas.length} tareas
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${(cierre.tareas.filter(t => t.completada).length / cierre.tareas.length) * 100}%`
                        }}
                      />
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-xs sm:text-sm text-white/70">
                        {cierre.completado ? '✅ Cierre completado exitosamente' : '⏳ Cierre en progreso'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 max-w-sm sm:max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">
                ¿Eliminar Cierre?
              </h3>
              <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">
                Esta acción no se puede deshacer. Se eliminará permanentemente el cierre y todas sus tareas asociadas.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-300 border border-white/20 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCierre(showDeleteConfirm)}
                  disabled={deletingId === showDeleteConfirm}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {deletingId === showDeleteConfirm ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2"></div>
                      Eliminando...
                    </div>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!isAuthenticated() || !isAdmin())) {
      router.push('/login')
    }
  }, [isAuthenticated, isAdmin, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <AdminPageContent />
}
