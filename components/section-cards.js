"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Clock, Users, TrendingUp, Timer } from "lucide-react"

export function SectionCards() {
  const [stats, setStats] = useState({
    totalCierres: 0,
    totalTrabajadores: 0,
    ventasHoy: 0,
    tiempoPromedioCierre: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const cards = [
    {
      title: "Cierres Completados",
      value: stats.totalCierres,
      icon: Clock,
      description: "Total este mes",
      color: "bg-blue-500"
    },
    {
      title: "Trabajadores Activos", 
      value: stats.totalTrabajadores,
      icon: Users,
      description: "Empleados registrados",
      color: "bg-green-500"
    },
    {
      title: "Ventas de Hoy",
      value: formatCurrency(stats.ventasHoy),
      icon: TrendingUp,
      description: "Ingresos del día",
      color: "bg-yellow-500"
    },
    {
      title: "Tiempo Promedio",
      value: `${stats.tiempoPromedioCierre} min`,
      icon: Timer,
      description: "Duración promedio de cierre",
      color: "bg-purple-500"
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4 sm:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="tracking-tight text-sm font-medium">
              {card.title}
            </div>
            <div className={`${card.color} rounded-full p-2 text-white`}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
