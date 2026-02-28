"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/contexts/ToastContext"
import { generateHoursPDF } from '@/lib/pdfHoursReport'
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Sun, Moon, Coffee, Save, CalendarCheck, BarChart3, Clock, Settings, FileText } from "lucide-react"
import { ScheduleSettings } from "@/components/admin/settings/ScheduleSettings"
import { Skeleton } from "@/components/ui/skeleton"

function getMonthLabel(year, month) {
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function getDaysInMonth(year, month) {
  const date = new Date(Date.UTC(year, month - 1, 1))
  const days = []
  while (date.getUTCMonth() === month - 1) {
    const iso = date.toISOString().slice(0, 10)
    const dayOfWeek = date.getUTCDay()
    const dayOfMonth = date.getUTCDate()
    days.push({ iso, dayOfWeek, dayOfMonth })
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return days
}

// DEFAULT INITIAL CONFIG (Will be overwritten by fetch)
// Day-indexed structure: 0=Sunday, 1=Monday, ..., 6=Saturday
const DEFAULT_TURNOS = {
  M: {
    label: 'Mañana',
    icon: Sun,
    // Default hours per day
    0: { hours: 5.5, start: '11:30', end: '17:00' },
    1: { hours: 4.5, start: '12:30', end: '17:00' },
    2: { hours: 4.5, start: '12:30', end: '17:00' },
    3: { hours: 4.5, start: '12:30', end: '17:00' },
    4: { hours: 4.5, start: '12:30', end: '17:00' },
    5: { hours: 4.5, start: '12:30', end: '17:00' },
    6: { hours: 5.5, start: '11:30', end: '17:00' },
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-300',
    darkBg: 'dark:bg-amber-900/20',
    darkBorder: 'dark:border-amber-700',
    darkText: 'dark:text-amber-400'
  },
  T: {
    label: 'Tarde',
    icon: Moon,
    0: { hours: 6, start: '17:00', end: '23:00' },
    1: { hours: 6, start: '17:00', end: '23:00' },
    2: { hours: 6, start: '17:00', end: '23:00' },
    3: { hours: 6, start: '17:00', end: '23:00' },
    4: { hours: 6, start: '17:00', end: '23:00' },
    5: { hours: 6, start: '17:00', end: '23:00' },
    6: { hours: 6, start: '17:00', end: '23:00' },
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-300',
    darkBg: 'dark:bg-blue-900/20',
    darkBorder: 'dark:border-blue-700',
    darkText: 'dark:text-blue-400'
  },
  L: {
    label: 'Libre',
    icon: Coffee,
    0: { hours: 0, start: '00:00', end: '00:00' },
    1: { hours: 0, start: '00:00', end: '00:00' },
    2: { hours: 0, start: '00:00', end: '00:00' },
    3: { hours: 0, start: '00:00', end: '00:00' },
    4: { hours: 0, start: '00:00', end: '00:00' },
    5: { hours: 0, start: '00:00', end: '00:00' },
    6: { hours: 0, start: '00:00', end: '00:00' },
    color: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-300',
    darkBg: 'dark:bg-gray-800/20',
    darkBorder: 'dark:border-gray-600',
    darkText: 'dark:text-gray-400'
  }
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function HorariosPage() {
  const { toast } = useToast()
  const now = new Date()
  const [anio, setAnio] = useState(now.getUTCFullYear())
  const [mes, setMes] = useState(now.getUTCMonth() + 1)
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingProgress, setSavingProgress] = useState({ current: 0, total: 0 })
  const [view, setView] = useState('resumen') // 'resumen' o 'planning'
  const [generatingReport, setGeneratingReport] = useState(false)

  // Dynamic Configuration
  const [turnosConfig, setTurnosConfig] = useState(DEFAULT_TURNOS)
  const [configName, setConfigName] = useState('Estándar')

  // Planning state: { trabajadorId: { fecha: 'M'|'T'|'L' } }
  const [planning, setPlanning] = useState({})

  // Fetch Workers & Configuration
  useEffect(() => {
    // 1. Fetch Workers
    fetch('/api/trabajadores')
      .then(r => r.json())
      .then(d => {
        if (d?.trabajadores) {
          // Filter: only active workers, exclude admin
          const activeWorkers = d.trabajadores.filter(t => {
            // Exclude if inactive
            if (t.activo !== true) return false

            // Exclude if cargo is 'admin'
            if (t.cargo === 'admin') return false

            // Exclude if name contains 'admin' (case insensitive)
            if (t.nombre?.toLowerCase().includes('admin')) return false

            return true
          })

          console.log('Total workers:', d.trabajadores.length)
          console.log('Active workers (excluding admin):', activeWorkers.length)

          setTrabajadores(activeWorkers)
          loadMonthPlanning(activeWorkers)
        }
      })
      .catch(() => { })

    // 2. Fetch Active Config
    fetch('/api/configuracion?clave=horarios_active_profile')
      .then(r => r.json())
      .then(data => {
        if (data && data.shifts) {
          // Merge fetched day-indexed data with full UI definition (icons, colors)
          const newConfig = { ...DEFAULT_TURNOS }

          // Map M/T/L with day-indexed structure
          Object.keys(data.shifts).forEach(key => {
            if (newConfig[key]) {
              // Preserve UI properties (icon, colors, label)
              const uiProps = {
                label: newConfig[key].label,
                icon: newConfig[key].icon,
                color: newConfig[key].color,
                textColor: newConfig[key].textColor,
                bgLight: newConfig[key].bgLight,
                borderColor: newConfig[key].borderColor,
                darkBg: newConfig[key].darkBg,
                darkBorder: newConfig[key].darkBorder,
                darkText: newConfig[key].darkText
              }

              // Merge day-specific data
              newConfig[key] = {
                ...uiProps,
                ...data.shifts[key]
              }
            }
          })
          setTurnosConfig(newConfig)
          setConfigName(data.profileName || 'Personalizado')
        }
      })
      .catch(err => console.error("Error loading config", err))

  }, [])

  const monthLabel = getMonthLabel(anio, mes)
  const daysInMonth = getDaysInMonth(anio, mes)

  // Use day-indexed configuration
  function getTurnoHours(turno, dayOfWeek) {
    return turnosConfig[turno][dayOfWeek]?.hours || 0
  }

  function getTurnoHorario(turno, dayOfWeek) {
    const dayConfig = turnosConfig[turno][dayOfWeek]
    if (!dayConfig) return 'N/A'
    return `${dayConfig.start} - ${dayConfig.end}`
  }

  async function loadMonthPlanning(trabajadoresList) {
    const trabajadoresData = trabajadoresList || trabajadores
    if (trabajadoresData.length === 0) return

    setLoading(true)
    try {
      const newPlanning = {}

      for (const trabajador of trabajadoresData) {
        const res = await fetch(`/api/horarios?mes=${mes}&anio=${anio}&trabajadorId=${trabajador.id}`)
        const data = await res.json()

        newPlanning[trabajador.id] = {}
        if (data.days) {
          data.days.forEach(day => {
            newPlanning[trabajador.id][day.fecha] = day.turno
          })
        }
      }

      setPlanning(newPlanning)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (trabajadores.length > 0) {
      loadMonthPlanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio])

  function changeMonth(delta) {
    let m = mes + delta
    let y = anio
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setMes(m)
    setAnio(y)
  }

  async function savePlanning() {
    setSaving(true)
    setSavingProgress({ current: 0, total: 0 })

    try {
      // Preparar todas las excepciones para enviar en batch
      const excepciones = []

      for (const [trabajadorId, dias] of Object.entries(planning)) {
        for (const [fecha, turno] of Object.entries(dias)) {
          // Send 'DELETE' if turno is null/falsy to clear the exception
          excepciones.push({
            trabajadorId,
            fecha,
            turno: turno || 'DELETE'
          })
        }
      }


      if (excepciones.length === 0) {
        toast({
          title: "Sin cambios",
          description: "No hay cambios para guardar",
          variant: "default"
        })
        return
      }

      setSavingProgress({ current: 0, total: excepciones.length })

      // Enviar todas las excepciones en una sola request
      const response = await fetch('/api/horarios/excepciones/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excepciones })
      })

      setSavingProgress({ current: excepciones.length, total: excepciones.length })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Planning Guardado",
          description: `Se han guardado ${result.excepciones.length} cambios correctamente`,
          variant: "default"
        })
        await loadMonthPlanning()
      } else {
        const error = await response.json()
        toast({
          title: "Error al guardar",
          description: error.error || "Ha ocurrido un error al guardar el planning",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving planning:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
      setSavingProgress({ current: 0, total: 0 })
    }
  }

  function setTurno(trabajadorId, fecha, turno) {
    setPlanning(prev => ({
      ...prev,
      [trabajadorId]: {
        ...prev[trabajadorId],
        [fecha]: turno
      }
    }))
  }

  function getTrabajadorStats(trabajadorId) {
    const turnos = planning[trabajadorId] || {}
    let mañanas = 0, tardes = 0, libres = 0, totalHoras = 0, sinAsignar = 0

    daysInMonth.forEach(day => {
      const turno = turnos[day.iso]
      if (turno === 'M') {
        mañanas++
        totalHoras += getTurnoHours('M', day.dayOfWeek)
      }
      else if (turno === 'T') {
        tardes++
        totalHoras += getTurnoHours('T', day.dayOfWeek)
      }
      else if (turno === 'L') {
        libres++
      }
      else {
        // Día sin asignar
        sinAsignar++
      }
    })

    return { mañanas, tardes, libres, sinAsignar, totalHoras, diasTrabajados: mañanas + tardes }
  }

  function getGlobalStats() {
    let totalMañanas = 0, totalTardes = 0, totalLibres = 0, totalHoras = 0

    trabajadores.forEach(t => {
      const stats = getTrabajadorStats(t.id)
      totalMañanas += stats.mañanas
      totalTardes += stats.tardes
      totalLibres += stats.libres
      totalHoras += stats.totalHoras
    })

    return { totalMañanas, totalTardes, totalLibres, totalHoras }
  }

  const generateHoursReport = async () => {
    setGeneratingReport(true)
    try {
      // Usar mes y año del estado actual (del selector existente)
      const response = await fetch(`/api/admin/reports/hours?month=${mes}&year=${anio}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar informe')
      }

      // Generar PDF
      generateHoursPDF(data)

      toast({
        title: "Informe generado",
        description: `Informe de horas de ${monthLabel} generado correctamente`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Error al generar informe',
        variant: "destructive"
      })
    } finally {
      setGeneratingReport(false)
    }
  }

  const globalStats = getGlobalStats()

  return (
    <AdminLayout>
      <SidebarProvider
        style={{
          "--sidebar-width": "19rem",
          "--header-height": "4rem",
        }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-6 max-w-[1600px]">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
                        <Calendar className="h-6 w-6 md:h-8 md:w-8" />
                        Planning
                        <span className="text-xs md:text-sm font-normal text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded-full border truncate max-w-[150px] md:max-w-none">{configName}</span>
                      </h1>
                      <p className="text-muted-foreground mt-1 text-xs md:text-sm">
                        Gestiona los turnos y horarios del personal.
                      </p>
                    </div>
                  </div>

                  {/* Navegación Mes */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => changeMonth(-1)}
                              className="h-8 w-8 md:h-10 md:w-10"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[150px] md:min-w-[200px] text-center">
                              <div className="font-bold text-lg md:text-xl capitalize">{monthLabel}</div>
                              <div className="text-xs md:text-sm text-muted-foreground">{daysInMonth.length} días</div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => changeMonth(1)}
                              className="h-8 w-8 md:h-10 md:w-10"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex w-full sm:w-auto overflow-x-auto gap-2 pb-1 sm:pb-0">
                            <Button
                              variant={view === 'resumen' ? 'default' : 'outline'}
                              onClick={() => setView('resumen')}
                              size="sm"
                              className="flex-1 sm:flex-none whitespace-nowrap"
                            >
                              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                              Resumen
                            </Button>
                            <Button
                              variant={view === 'planning' ? 'default' : 'outline'}
                              onClick={() => setView('planning')}
                              size="sm"
                              className="flex-1 sm:flex-none whitespace-nowrap"
                            >
                              <CalendarCheck className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                              Planning
                            </Button>
                            <Button
                              variant={view === 'configuracion' ? 'default' : 'outline'}
                              onClick={() => setView('configuracion')}
                              size="sm"
                              className="flex-1 sm:flex-none whitespace-nowrap"
                            >
                              <Settings className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                              Config
                            </Button>
                            <Button
                              onClick={generateHoursReport}
                              disabled={generatingReport || loading}
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none whitespace-nowrap border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <FileText className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                              {generatingReport ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-2"></div>
                                  <span className="hidden sm:inline">Generando...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                'Informe RRHH'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estadísticas Globales */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Mañanas</CardTitle>
                        <Sun className="h-4 w-4 text-amber-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{globalStats.totalMañanas}</div>
                        <p className="text-xs text-muted-foreground mt-1">turnos asignados</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tardes</CardTitle>
                        <Moon className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{globalStats.totalTardes}</div>
                        <p className="text-xs text-muted-foreground mt-1">turnos asignados</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Días Libres</CardTitle>
                        <Coffee className="h-4 w-4 text-gray-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{globalStats.totalLibres}</div>
                        <p className="text-xs text-muted-foreground mt-1">días libres</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
                        <Clock className="h-4 w-4 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{globalStats.totalHoras}h</div>
                        <p className="text-xs text-muted-foreground mt-1">horas totales del mes</p>
                      </CardContent>
                    </Card>
                  </div>

                  {loading ? (
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-6 w-[250px]" />
                        <Skeleton className="h-4 w-[350px] mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Worker selector skeleton */}
                          <div>
                            <Skeleton className="h-4 w-[150px] mb-2" />
                            <div className="flex gap-2">
                              {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-24 rounded-lg" />
                              ))}
                            </div>
                          </div>
                          {/* Calendar grid skeleton */}
                          <div className="grid grid-cols-7 gap-2">
                            {[...Array(35)].map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : view === 'resumen' ? (
                    <ResumenView
                      trabajadores={trabajadores}
                      daysInMonth={daysInMonth}
                      planning={planning}
                      getTrabajadorStats={getTrabajadorStats}
                      turnosConfig={turnosConfig}
                    />
                  ) : view === 'planning' ? (
                    <PlanningView
                      trabajadores={trabajadores}
                      daysInMonth={daysInMonth}
                      planning={planning}
                      setTurno={setTurno}
                      savePlanning={savePlanning}
                      saving={saving}
                      savingProgress={savingProgress}
                      getTrabajadorStats={getTrabajadorStats}
                      turnosConfig={turnosConfig}
                      getTurnoHours={getTurnoHours}
                    />
                  ) : (
                    <ScheduleSettings onSave={() => {
                      // Reload configuration after save
                      fetch('/api/configuracion?clave=horarios_active_profile')
                        .then(r => r.json())
                        .then(data => {
                          if (data && data.shifts) {
                            const newConfig = { ...DEFAULT_TURNOS }
                            Object.keys(data.shifts).forEach(key => {
                              if (newConfig[key]) {
                                const uiProps = {
                                  label: newConfig[key].label,
                                  icon: newConfig[key].icon,
                                  color: newConfig[key].color,
                                  textColor: newConfig[key].textColor,
                                  bgLight: newConfig[key].bgLight,
                                  borderColor: newConfig[key].borderColor,
                                  darkBg: newConfig[key].darkBg,
                                  darkBorder: newConfig[key].darkBorder,
                                  darkText: newConfig[key].darkText
                                }
                                newConfig[key] = {
                                  ...uiProps,
                                  ...data.shifts[key]
                                }
                              }
                            })
                            setTurnosConfig(newConfig)
                            setConfigName(data.profileName || 'Personalizado')
                          }
                        })
                    }} />
                  )}
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}

function ResumenView({ trabajadores, daysInMonth, planning, getTrabajadorStats, turnosConfig }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Mensual de Horarios</CardTitle>
        <CardDescription>
          Vista general de horas trabajadas por cada empleado en el mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trabajadores.map(trabajador => {
            const stats = getTrabajadorStats(trabajador.id)
            return (
              <div key={trabajador.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{trabajador.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.diasTrabajados} días trabajados • {stats.libres} días libres
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Sun className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Mañanas</span>
                      </div>
                      <div className="text-xl font-bold text-amber-600">{stats.mañanas}</div>
                      <div className="text-xs text-muted-foreground">turnos</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Moon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Tardes</span>
                      </div>
                      <div className="text-xl font-bold text-blue-600">{stats.tardes}</div>
                      <div className="text-xs text-muted-foreground">turnos</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Coffee className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Libres</span>
                      </div>
                      <div className="text-xl font-bold text-gray-600">{stats.libres}</div>
                      <div className="text-xs text-muted-foreground">días libres</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Total</span>
                      </div>
                      <div className="text-xl font-bold text-purple-600">{stats.totalHoras}h</div>
                      <div className="text-xs text-muted-foreground">horas</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to group days by identical schedule
function getTurnoSummary(turnoKey, config) {
  const DIAS_INDICES = [1, 2, 3, 4, 5, 6, 0] // Start Lunes (1) end Domingo (0)
  const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const turno = config[turnoKey]

  if (!turno) return []

  const scheduleGroups = [] // [{ days: [1,2,3], start: '10:00', end: '14:00', hours: 4 }]
  let currentGroup = null

  DIAS_INDICES.forEach(dayIdx => {
    const dayConfig = turno[dayIdx]
    const hours = dayConfig?.hours || 0
    const start = dayConfig?.start || '00:00'
    const end = dayConfig?.end || '00:00'
    const scheduleKey = `${start}-${end}-${hours}`

    if (currentGroup && currentGroup.key === scheduleKey) {
      currentGroup.days.push(dayIdx)
    } else {
      if (currentGroup) scheduleGroups.push(currentGroup)
      currentGroup = {
        key: scheduleKey,
        days: [dayIdx],
        start,
        end,
        hours
      }
    }
  })
  if (currentGroup) scheduleGroups.push(currentGroup)

  return scheduleGroups.map(group => {
    // Format day range (e.g., Lun-Mié or just Lun)
    let dayLabel = ''
    if (group.days.length === 1) {
      dayLabel = DIAS_NOMBRES[group.days[0]]
    } else if (group.days.length === 7) {
      dayLabel = 'Todos los días'
    } else {
      // Check if days are consecutive
      // Since we iterate DIAS_INDICES, they are by definition consecutive in our loop if grouped.
      const first = DIAS_NOMBRES[group.days[0]]
      const last = DIAS_NOMBRES[group.days[group.days.length - 1]]
      dayLabel = `${first}-${last}`
    }

    if (group.hours === 0) return null

    return `${dayLabel}: ${group.start} - ${group.end} (${group.hours}h)`
  }).filter(Boolean)
}

function PlanningView({ trabajadores, daysInMonth, planning, setTurno, savePlanning, saving, savingProgress, getTrabajadorStats, turnosConfig, getTurnoHours }) {
  const [selectedTrabajador, setSelectedTrabajador] = useState(trabajadores[0]?.id || '')

  // Agrupar días por semanas (empezando en Lunes)
  const weeks = []
  let currentWeek = []

  // Rellenar días vacíos al inicio si el mes no empieza en lunes
  // Convertir: domingo=0 a domingo=6, lunes=1 a lunes=0, etc.
  const firstDayOfWeek = daysInMonth[0]?.dayOfWeek || 0
  const firstDayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  for (let i = 0; i < firstDayOffset; i++) {
    currentWeek.push(null)
  }

  daysInMonth.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  // Completar última semana si es necesaria
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  const currentTrabajador = trabajadores.find(t => t.id === selectedTrabajador)
  const stats = currentTrabajador ? getTrabajadorStats(selectedTrabajador) : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Planning Mensual</CardTitle>
              <CardDescription>
                Asigna los turnos para cada trabajador usando el calendario
              </CardDescription>
            </div>
            <Button onClick={savePlanning} disabled={saving} size="lg" className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {savingProgress.total > 0 ? (
                    <>
                      <span className="hidden sm:inline">Guardando... ({savingProgress.current}/{savingProgress.total})</span>
                      <span className="sm:hidden">Guardando...</span>
                    </>
                  ) : (
                    'Guardando...'
                  )}
                </div>
              ) : (
                'Guardar Planning'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Selector de trabajador */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Seleccionar Trabajador</label>
            <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {trabajadores.map(t => {
                const tStats = getTrabajadorStats(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrabajador(t.id)}
                    className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-all text-sm ${selectedTrabajador === t.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 bg-card'
                      }`}
                  >
                    <div className="font-medium whitespace-nowrap">{t.nombre}</div>
                    <div className="text-xs opacity-80">{tStats.totalHoras}h</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nota sobre horarios de fin de semana */}
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 text-lg">★</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Horarios Especiales de Fin de Semana</div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Los días marcados con ★ (Sáb-Dom) usan el horario de fin de semana definido en la configuración activa.
                </div>
              </div>
            </div>
          </div>

          {/* Stats del trabajador actual */}
          {stats && (
            <div className="grid grid-cols-4 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Sun className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <div className="font-bold text-amber-600">{stats.mañanas}</div>
                <div className="text-xs text-muted-foreground">Mañanas</div>
              </div>
              <div className="text-center">
                <Moon className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-bold text-blue-600">{stats.tardes}</div>
                <div className="text-xs text-muted-foreground">Tardes</div>
              </div>
              <div className="text-center">
                <Coffee className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <div className="font-bold text-gray-600">{stats.libres}</div>
                <div className="text-xs text-muted-foreground">Libres</div>
              </div>
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="font-bold text-purple-600">{stats.totalHoras}h</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          )}

          {/* Calendario por semanas - Desktop Grid */}
          <div className="hidden md:block space-y-3">
            {/* Header días de la semana - Responsive */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {DIAS_SEMANA.map((dia, index) => (
                <div key={index} className="text-center font-bold text-xs sm:text-sm p-1 sm:p-2">
                  <span className="hidden sm:inline">{dia}</span>
                  <span className="sm:hidden">{dia.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Semanas - Responsive */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="aspect-square min-h-[60px] sm:min-h-[80px]" />
                  }

                  const turno = planning[selectedTrabajador]?.[day.iso] || null // null for empty/unassigned
                  const turnoInfo = turno ? turnosConfig[turno] : null
                  const Icon = turnoInfo?.icon
                  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
                  const turnoHoras = turno ? getTurnoHours(turno, day.dayOfWeek) : 0

                  // Cycle logic for Grid
                  const handleCycle = () => {
                    const cycle = [null, 'M', 'T', 'L']
                    const currentIndex = cycle.indexOf(turno || null)
                    const nextTurno = cycle[(currentIndex + 1) % cycle.length]
                    setTurno(selectedTrabajador, day.iso, nextTurno)
                  }

                  return (
                    <div key={day.iso} className="aspect-square min-h-[60px] sm:min-h-[80px]">
                      <div
                        onClick={handleCycle}
                        className={`h-full border-2 rounded-lg p-1 sm:p-2 flex flex-col transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 select-none
                          ${turno
                            ? `${turnoInfo.borderColor} ${turnoInfo.bgLight} ${turnoInfo.darkBg} ${turnoInfo.darkBorder}`
                            : 'border-dashed border-gray-300 dark:border-gray-700 hover:border-primary/50 bg-gray-50/50 dark:bg-gray-800/10'
                          }
                          ${isWeekend ? 'ring-2 ring-purple-300 dark:ring-purple-700 ring-offset-1 dark:ring-offset-gray-900' : ''}
                        `}
                      >
                        {/* Día del mes */}
                        <div className="flex justify-between items-start">
                          <span className={`text-xs sm:text-sm font-bold ${turno ? '' : 'text-muted-foreground'}`}>
                            {day.dayOfMonth}
                          </span>
                          {isWeekend && <span className="text-[10px] text-purple-600 dark:text-purple-400">★</span>}
                        </div>

                        {/* Contenido Central */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-1">
                          {turno ? (
                            <>
                              <Icon className={`h-5 w-5 sm:h-7 sm:w-7 ${turnoInfo.textColor} ${turnoInfo.darkText}`} />
                              {turno !== 'L' && (
                                <span className="text-[10px] font-medium text-muted-foreground">{turnoHoras}h</span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 font-medium">Asignar</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Calendario List View - Mobile Only */}
          <div className="md:hidden space-y-2 mt-4">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wide">Días del mes</h3>
            {daysInMonth.map((day) => {
              const turno = planning[selectedTrabajador]?.[day.iso] || null
              const turnoInfo = turno ? turnosConfig[turno] : null
              const Icon = turnoInfo?.icon
              const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
              const turnoHoras = turno ? getTurnoHours(turno, day.dayOfWeek) : 0
              const dayName = DIAS_SEMANA[day.dayOfWeek === 0 ? 6 : day.dayOfWeek - 1]

              const handleCycle = () => {
                const cycle = [null, 'M', 'T', 'L']
                const currentIndex = cycle.indexOf(turno || null)
                const nextTurno = cycle[(currentIndex + 1) % cycle.length]
                setTurno(selectedTrabajador, day.iso, nextTurno)
              }

              return (
                <div
                  key={day.iso}
                  onClick={handleCycle}
                  className={`flex items-center justify-between p-3 rounded-lg border active:scale-[0.98] transition-all cursor-pointer
                    ${turno
                      ? `${turnoInfo.borderColor} ${turnoInfo.bgLight} ${turnoInfo.darkBg} ${turnoInfo.darkBorder}`
                      : 'border-dashed border-gray-200 hover:border-primary/50'
                    }
                    ${isWeekend ? 'border-l-4 border-l-purple-400 bg-purple-50/30' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isWeekend ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>
                      {day.dayOfMonth}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{dayName}</div>
                      {isWeekend && <div className="text-[10px] text-purple-600">Fin de Semana</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {turno ? (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className={`font-bold text-sm ${turnoInfo.textColor}`}>{turnoInfo.label}</div>
                          {turno !== 'L' && <div className="text-xs text-muted-foreground">{turnoHoras}h ({turnoInfo[day.dayOfWeek]?.start}-{turnoInfo[day.dayOfWeek]?.end})</div>}
                        </div>
                        <div className={`p-2 rounded-full ${turnoInfo.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Tocar para asignar</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leyenda y herramientas */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(turnosConfig).map(([key, turno]) => {
                const Icon = turno.icon
                const summaries = getTurnoSummary(key, turnosConfig)

                return (
                  <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${turno.color} flex-shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1">{turno.label}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {summaries.length > 0 ? (
                          summaries.map((summary, idx) => (
                            <div key={idx}>{summary}</div>
                          ))
                        ) : (
                          <div>Sin horario definido</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Herramientas rápidas */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm font-medium mb-3">⚡ Herramientas Rápidas</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                  onClick={() => {
                    daysInMonth.forEach(day => {
                      if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
                        setTurno(selectedTrabajador, day.iso, 'M')
                      } else {
                        setTurno(selectedTrabajador, day.iso, 'L')
                      }
                    })
                  }}
                >
                  <Sun className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Lun-Vie Mañanas</span>
                  <span className="sm:hidden">L-V Mañanas</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                  onClick={() => {
                    daysInMonth.forEach(day => {
                      if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
                        setTurno(selectedTrabajador, day.iso, 'T')
                      } else {
                        setTurno(selectedTrabajador, day.iso, 'L')
                      }
                    })
                  }}
                >
                  <Moon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Lun-Vie Tardes</span>
                  <span className="sm:hidden">L-V Tardes</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                  onClick={() => {
                    daysInMonth.forEach(day => {
                      setTurno(selectedTrabajador, day.iso, 'L')
                    })
                  }}
                >
                  <Coffee className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Limpiar Todo</span>
                  <span className="sm:hidden">Limpiar</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
