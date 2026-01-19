"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Sun, TrendingUp, User, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function SectionCards() {
  const [stats, setStats] = useState({
    ventasTurnoManana: 0,
    totalTrabajadores: 0,
    ventasHoy: 0,
    trabajadorActual: null
  })
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-3 sm:p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-12 w-12 sm:h-10 sm:w-10 rounded-full" />
            </div>
            <div className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </div>
          </div>
        ))}
      </div>
    )
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

  // Determinar título y configuración para la tarjeta de trabajador
  const getWorkerCardConfig = () => {
    if (!stats.trabajadorActual) {
      return {
        title: "Turno Actual",
        value: "Sin turno",
        icon: User,
        description: "Fuera de horario",
        color: "bg-gray-500",
        badge: null,
        extraInfo: null
      }
    }

    const isProximo = stats.trabajadorActual.proximo

    return {
      title: isProximo ? "Próximo Turno" : "Turno Actual",
      value: stats.trabajadorActual.nombre,
      icon: isProximo ? Clock : User,
      description: `${stats.trabajadorActual.turno} (${stats.trabajadorActual.horaInicio}-${stats.trabajadorActual.horaFin})`,
      color: isProximo ? "bg-amber-500" : "bg-green-500",
      badge: isProximo
        ? { text: "Próximo", variant: "warning" }
        : { text: "Activo", variant: "success" },
      extraInfo: isProximo
        ? `Comienza en ${formatTimeRemaining(stats.trabajadorActual.minutosRestantes)}`
        : formatTimeRemaining(stats.trabajadorActual.minutosRestantes)
    }
  }

  const workerCard = getWorkerCardConfig()

  const cards = [
    {
      title: "Ventas turno mañana",
      value: formatCurrency(stats.ventasTurnoManana),
      icon: Sun,
      description: "Ventas del turno mañana",
      color: "bg-orange-500",
      badge: null,
      extraInfo: null
    },
    {
      title: "Total ventas del día",
      value: formatCurrency(stats.ventasHoy),
      icon: TrendingUp,
      description: "Ingresos del día",
      color: "bg-yellow-500",
      badge: null,
      extraInfo: null
    },
    workerCard
  ]

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-2xl bg-card overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="p-4 bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </div>
                {card.badge && (
                  <Badge
                    variant={card.badge.variant}
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {card.badge.text}
                  </Badge>
                )}
              </div>
              <div className={`${card.color} rounded-xl p-2 text-white shadow-sm`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {card.description}
            </p>
            {card.extraInfo && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  ⏰ <span className="font-semibold text-foreground">{card.extraInfo}</span> restantes
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
