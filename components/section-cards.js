"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Sun, TrendingUp, Users, Moon, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function SectionCards() {
  const [stats, setStats] = useState({
    ventasTurnoManana: 0,
    totalTrabajadores: 0,
    ventasHoy: 0,
    turnosActivos: []
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
        setStats({
          ...data,
          // Retrocompatibilidad: si la API aún devuelve solo trabajadorActual, adaptarlo
          turnosActivos: data.turnosActivos
            ?? (data.trabajadorActual ? [data.trabajadorActual] : [])
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

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
    if (!minutos || minutos <= 0) return 'Finalizado'
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return horas > 0 ? `${horas}h ${mins}min` : `${mins}min`
  }

  const turnoIcon = (turno) => {
    if (turno === 'Mañana') return <Sun className="h-3.5 w-3.5 text-amber-500" />
    if (turno === 'Noche')  return <Star className="h-3.5 w-3.5 text-violet-500" />
    return <Moon className="h-3.5 w-3.5 text-blue-500" />
  }

  // ── Worker card ───────────────────────────────────────────────────────────────
  const renderWorkerCard = () => {
    const activos = stats.turnosActivos ?? []
    const isProximo = activos.length > 0 && activos[0]?.proximo

    // Sin turnos asignados
    if (activos.length === 0) {
      return (
        <div
          className="rounded-2xl bg-card overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="p-4 bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Turno Actual
              </div>
              <div className="bg-gray-500 rounded-xl p-2 text-white shadow-sm">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-muted-foreground">Sin turno</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Fuera de horario</p>
          </div>
        </div>
      )
    }

    // Un solo worker activo / próximo
    if (activos.length === 1) {
      const w = activos[0]
      return (
        <div
          className="rounded-2xl bg-card overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="p-4 bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {isProximo ? 'Próximo Turno' : 'Turno Actual'}
                </div>
                <Badge
                  variant={isProximo ? 'warning' : 'success'}
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {isProximo ? 'Próximo' : 'Activo'}
                </Badge>
              </div>
              <div className={`${isProximo ? 'bg-amber-500' : 'bg-green-500'} rounded-xl p-2 text-white shadow-sm`}>
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{w.nombre}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {w.turno} · {w.horaInicio}–{w.horaFin}
            </p>
            {w.minutosRestantes > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  ⏰ <span className="font-semibold text-foreground">{formatTimeRemaining(w.minutosRestantes)}</span>
                  {isProximo ? ' para empezar' : ' restantes'}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Dos o más workers activos (solapamiento de turnos)
    return (
      <div
        className="rounded-2xl bg-card overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <div className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Turno Actual
              </div>
              <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                {activos.length} activos
              </Badge>
            </div>
            <div className="bg-green-500 rounded-xl p-2 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-2.5">
            {activos.map((w, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  {turnoIcon(w.turno)}
                  <span className="font-bold text-base leading-tight">{w.nombre}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[11px] font-medium text-muted-foreground">{w.turno}</div>
                  <div className="text-[11px] font-semibold">{w.horaInicio}–{w.horaFin}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

      {/* Ventas turno mañana */}
      <div
        className="rounded-2xl bg-card overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <div className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Ventas turno mañana
            </div>
            <div className="bg-orange-500 rounded-xl p-2 text-white shadow-sm">
              <Sun className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight">
            {formatCurrency(stats.ventasTurnoManana)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Ventas del turno mañana</p>
        </div>
      </div>

      {/* Total ventas del día */}
      <div
        className="rounded-2xl bg-card overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <div className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total ventas del día
            </div>
            <div className="bg-yellow-500 rounded-xl p-2 text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight">
            {formatCurrency(stats.ventasHoy)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Ingresos del día</p>
        </div>
      </div>

      {/* Worker(s) activo(s) — 0 / 1 / 2+ */}
      {renderWorkerCard()}

    </div>
  )
}
