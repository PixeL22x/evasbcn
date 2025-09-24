'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  requireWorker = false,
  fallback = null 
}) {
  const { isAuthenticated, isAdmin, isWorker, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !isAuthenticated()) {
      router.push('/login')
      return
    }

    if (requireAdmin && !isAdmin()) {
      router.push('/')
      return
    }

    if (requireWorker && !isWorker()) {
      router.push('/')
      return
    }
  }, [isAuthenticated(), isAdmin(), isWorker(), loading, requireAuth, requireAdmin, requireWorker, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Cargando...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated()) {
    return fallback || null
  }

  if (requireAdmin && !isAdmin()) {
    return fallback || null
  }

  if (requireWorker && !isWorker()) {
    return fallback || null
  }

  return children
}
