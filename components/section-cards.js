"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Sun, Users, TrendingUp, User } from "lucide-react"

export function SectionCards() {
  const [stats, setStats] = useState({
    ventasTurnoManana: 0,
    totalTrabajadores: 0,
    ventasHoy: 0,
    trabajadorActual: null
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

  const formatTimeRemaining = (minutos) => {
    if (minutos <= 0) return 'Finalizado'
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (horas > 0) {
      return `${horas}h ${mins}min`
    }
    return `${mins}min`
  }

  const cards = [
    {
      title: "Trabajadores Activos", 
      value: stats.totalTrabajadores,
      icon: Users,
      description: "Empleados registrados",
      color: "bg-green-500"
    },
    {
      title: "Total Ventas Turno Mañana",
      value: formatCurrency(stats.ventasTurnoManana),
      icon: Sun,
      description: "Ventas del turno mañana",
      color: "bg-orange-500"
    },
    {
      title: "Ventas de Hoy",
      value: formatCurrency(stats.ventasHoy),
      icon: TrendingUp,
      description: "Ingresos del día",
      color: "bg-yellow-500"
    },
    {
      title: "Trabajador Actual",
      value: stats.trabajadorActual ? stats.trabajadorActual.nombre : "Sin turno",
      icon: User,
      description: stats.trabajadorActual 
        ? `${stats.trabajadorActual.turno} (${stats.trabajadorActual.horaInicio}-${stats.trabajadorActual.horaFin})`
        : "Fuera de horario",
      color: stats.trabajadorActual ? "bg-purple-500" : "bg-gray-500",
      extraInfo: stats.trabajadorActual ? formatTimeRemaining(stats.trabajadorActual.minutosRestantes) : null
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
            {card.extraInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                ⏰ {card.extraInfo} restantes
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
