'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

function TrabajadoresPageContent() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    password: ''
  })

  useEffect(() => {
    loadTrabajadores()
  }, [])

  const loadTrabajadores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trabajadores')
      if (response.ok) {
        const data = await response.json()
        setTrabajadores(data.trabajadores)
      }
    } catch (error) {
      console.error('Error al cargar trabajadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nombre.trim() || !formData.password.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Trabajador creado exitosamente')
        setFormData({ nombre: '', password: '' })
        setShowForm(false)
        loadTrabajadores()
      } else {
        alert(data.error || 'Error al crear trabajador')
      }
    } catch (error) {
      console.error('Error al crear trabajador:', error)
      alert('Error al crear trabajador')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al trabajador "${nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/trabajadores/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Trabajador eliminado exitosamente')
        loadTrabajadores()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar trabajador')
      }
    } catch (error) {
      console.error('Error al eliminar trabajador:', error)
      alert('Error al eliminar trabajador')
    }
  }

  const handleToggleActivo = async (id, activo) => {
    try {
      const response = await fetch(`/api/trabajadores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !activo })
      })

      if (response.ok) {
        loadTrabajadores()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al actualizar trabajador')
      }
    } catch (error) {
      console.error('Error al actualizar trabajador:', error)
      alert('Error al actualizar trabajador')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <span className="text-3xl">👷</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Gestión de Trabajadores
          </h1>
          <p className="text-white/70">
            Administra los trabajadores del sistema de cierres
          </p>
        </div>

        {/* Botón para agregar trabajador */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {showForm ? '❌ Cancelar' : '➕ Agregar Trabajador'}
          </button>
        </div>

        {/* Formulario para agregar trabajador */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Nuevo Trabajador</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Nombre del Trabajador
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contraseña para el trabajador"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                    saving
                      ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                  }`}
                >
                  {saving ? 'Creando...' : 'Crear Trabajador'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-500/30 hover:bg-gray-500/50 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de trabajadores */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Trabajadores Registrados ({trabajadores.length})
          </h2>
          
          {trabajadores.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👷‍♂️</div>
              <h3 className="text-xl font-bold text-white mb-2">No hay trabajadores registrados</h3>
              <p className="text-white/70">
                Agrega el primer trabajador para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trabajadores.map((trabajador) => (
                <div key={trabajador.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium text-lg">
                      {trabajador.nombre}
                    </h3>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      trabajador.activo 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {trabajador.activo ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  
                  <div className="text-white/60 text-sm mb-4">
                    <p>Usuario: <span className="text-white">{trabajador.nombre}</span></p>
                    <p>Registrado: {new Date(trabajador.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActivo(trabajador.id, trabajador.activo)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        trabajador.activo
                          ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                      }`}
                    >
                      {trabajador.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(trabajador.id, trabajador.nombre)}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de regreso */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 border border-white/20"
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TrabajadoresPage() {
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

  return <TrabajadoresPageContent />
}











