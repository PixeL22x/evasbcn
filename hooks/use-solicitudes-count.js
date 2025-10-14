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
    fetchCount()
    
    // Actualizar el conteo cada 30 segundos
    const interval = setInterval(fetchCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { count, loading, refetch: fetchCount }
}











