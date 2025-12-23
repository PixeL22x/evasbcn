'use client'

import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MobileBottomNav } from './MobileBottomNav'

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [minLoadingTime, setMinLoadingTime] = useState(true)

  useEffect(() => {
    // Ensure loading animation shows for at least 800ms for better UX
    const timer = setTimeout(() => {
      setMinLoadingTime(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  const showLoading = loading || minLoadingTime

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <svg
              className="relative w-12 h-12 mx-auto text-primary animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>

          {/* Text with subtle animation */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Verificando acceso</p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
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
  if (isAuthenticated() && user && user.role && user.role !== 'admin') {
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

  return (
    <>
      {/* Main content with bottom padding on mobile for the nav bar */}
      <div className="pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}



