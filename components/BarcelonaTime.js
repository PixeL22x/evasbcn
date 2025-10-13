"use client"

import { useState, useEffect } from 'react'

export function BarcelonaTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const barcelonaTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}))
      const timeString = barcelonaTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      setTime(timeString)
    }

    // Actualizar inmediatamente
    updateTime()
    
    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
      <span className="text-sm font-mono font-medium">{time}</span>
      <span className="text-xs text-muted-foreground">/ Bcn</span>
    </div>
  )
}
