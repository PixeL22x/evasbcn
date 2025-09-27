'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente al nuevo dashboard
    router.replace('/admin/dashboard')
  }, [router])

  // Mostrar un loading mientras se redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70">Redirigiendo al panel de administración...</p>
      </div>
    </div>
  )
}

