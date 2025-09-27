'use client'

import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h1>
          <p className="text-white/70 mb-4">No tienes permisos para acceder a esta página</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Ir al Login
          </button>
        </div>
      </div>
    )
  }

  // Solo mostrar mensaje de acceso denegado si el usuario está autenticado y no es admin
  // No mostrar nada si no está autenticado (se redirigirá automáticamente)
  if (isAuthenticated && user && user.role && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h1>
          <p className="text-white/70 mb-4">Solo los administradores pueden acceder a esta página</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return children
}

