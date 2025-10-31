"use client"

import { useState, useEffect } from 'react'

export function useSolicitudesCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/solicitudes-cambio/count')
      if (response.ok) {
        const data = await response.json()
        setCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching solicitudes count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Cargar inicialmente
    fetchCount()
    
    // Actualizar cuando el usuario vuelve a la pestaña (después de estar en otra pestaña)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCount()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { count, loading, refetch: fetchCount }
}





















