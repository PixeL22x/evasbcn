"use client"

import { useState, useEffect } from "react"
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
import { Calendar, ChevronLeft, ChevronRight, Sun, Moon, Coffee, Save, CalendarCheck, BarChart3, Clock } from "lucide-react"

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

const TURNOS = {
  M: { 
    label: 'Mañana', 
    icon: Sun, 
    hours: 4.5,
    hoursWeekend: 5.5,
    horario: '12:30 PM - 5:00 PM',
    horarioWeekend: '11:30 AM - 5:00 PM',
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
    hours: 6,
    hoursWeekend: 6,
    horario: '5:00 PM - 11:00 PM',
    horarioWeekend: '5:00 PM - 11:00 PM',
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
    hours: 0,
    hoursWeekend: 0,
    horario: 'Día libre',
    horarioWeekend: 'Día libre',
    color: 'bg-gray-400', 
    textColor: 'text-gray-700', 
    bgLight: 'bg-gray-50', 
    borderColor: 'border-gray-300',
    darkBg: 'dark:bg-gray-800/20',
    darkBorder: 'dark:border-gray-600',
    darkText: 'dark:text-gray-400'
  }
}

function getTurnoHours(turno, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  return isWeekend ? TURNOS[turno].hoursWeekend : TURNOS[turno].hours
}

function getTurnoHorario(turno, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  return isWeekend ? TURNOS[turno].horarioWeekend : TURNOS[turno].horario
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function HorariosPage() {
  const now = new Date()
  const [anio, setAnio] = useState(now.getUTCFullYear())
  const [mes, setMes] = useState(now.getUTCMonth() + 1)
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('resumen') // 'resumen' o 'planning'
  
  // Planning state: { trabajadorId: { fecha: 'M'|'T'|'L' } }
  const [planning, setPlanning] = useState({})

  useEffect(() => {
    fetch('/api/trabajadores')
      .then(r => r.json())
      .then(d => {
        if (d?.trabajadores) {
          setTrabajadores(d.trabajadores)
          loadMonthPlanning(d.trabajadores)
        }
      })
      .catch(() => {})
  }, [])

  const monthLabel = getMonthLabel(anio, mes)
  const daysInMonth = getDaysInMonth(anio, mes)

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
    try {
      // Save for each trabajador
      for (const [trabajadorId, dias] of Object.entries(planning)) {
        for (const [fecha, turno] of Object.entries(dias)) {
          await fetch('/api/horarios/excepciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trabajadorId, fecha, turno })
          })
        }
      }
      alert('Planning mensual guardado correctamente')
      await loadMonthPlanning()
    } catch (error) {
      alert('Error al guardar el planning')
    } finally {
      setSaving(false)
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Calendar className="h-8 w-8" />
                        Planning de Horarios
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Lun-Vie: Mañana 12:30-17:00 (4.5h) • Tarde 17:00-23:00 (6h) | Sáb-Dom: Mañana 11:30-17:00 (5.5h) • Tarde 17:00-23:00 (6h)
                      </p>
                    </div>
                  </div>

                  {/* Navegación Mes */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => changeMonth(-1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="min-w-[200px] text-center">
                            <div className="font-bold text-xl capitalize">{monthLabel}</div>
                            <div className="text-sm text-muted-foreground">{daysInMonth.length} días</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => changeMonth(1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant={view === 'resumen' ? 'default' : 'outline'}
                            onClick={() => setView('resumen')}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Ver Resumen
                          </Button>
                          <Button
                            variant={view === 'planning' ? 'default' : 'outline'}
                            onClick={() => setView('planning')}
                          >
                            <CalendarCheck className="h-4 w-4 mr-2" />
                            Hacer Planning
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estadísticas Globales */}
                  <div className="grid gap-4 md:grid-cols-4">
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
                      <CardContent className="py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Cargando horarios...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : view === 'resumen' ? (
                    <ResumenView 
                      trabajadores={trabajadores}
                      daysInMonth={daysInMonth}
                      planning={planning}
                      getTrabajadorStats={getTrabajadorStats}
                    />
                  ) : (
                    <PlanningView
                      trabajadores={trabajadores}
                      daysInMonth={daysInMonth}
                      planning={planning}
                      setTurno={setTurno}
                      savePlanning={savePlanning}
                      saving={saving}
                      getTrabajadorStats={getTrabajadorStats}
                    />
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

function ResumenView({ trabajadores, daysInMonth, planning, getTrabajadorStats }) {
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

function PlanningView({ trabajadores, daysInMonth, planning, setTurno, savePlanning, saving, getTrabajadorStats }) {
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

  function aplicarATodos(fecha, turno) {
    trabajadores.forEach(t => {
      setTurno(t.id, fecha, turno)
    })
  }

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
            <Button onClick={savePlanning} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Planning'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Selector de trabajador */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Seleccionar Trabajador</label>
            <div className="flex flex-wrap gap-2">
              {trabajadores.map(t => {
                const tStats = getTrabajadorStats(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrabajador(t.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedTrabajador === t.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                    }`}
                  >
                    <div className="font-medium">{t.nombre}</div>
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
                  Los días marcados con ★ (Sáb-Dom) tienen horarios diferentes: Mañana inicia 1 hora antes (11:30 AM) con 5.5h en vez de 4.5h
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

          {/* Calendario por semanas */}
          <div className="space-y-3">
            {/* Header días de la semana */}
            <div className="grid grid-cols-7 gap-2">
              {DIAS_SEMANA.map((dia, index) => (
                <div key={index} className="text-center font-bold text-sm p-2">
                  {dia}
                </div>
              ))}
            </div>

            {/* Semanas */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="aspect-square" />
                  }
                  
                  const turno = planning[selectedTrabajador]?.[day.iso] || 'L'
                  const turnoInfo = TURNOS[turno]
                  const Icon = turnoInfo.icon
                  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
                  const turnoHoras = getTurnoHours(turno, day.dayOfWeek)
                  
                  return (
                    <div key={day.iso} className="aspect-square">
                      <div className={`h-full border-2 ${turnoInfo.borderColor} ${turnoInfo.bgLight} ${turnoInfo.darkBg} ${turnoInfo.darkBorder} rounded-lg p-1.5 flex flex-col transition-all hover:shadow-md ${isWeekend ? 'ring-2 ring-purple-300 dark:ring-purple-700' : ''}`}>
                        <div className="text-center font-bold text-sm mb-0.5 flex items-center justify-center gap-1">
                          {day.dayOfMonth}
                          {isWeekend && <span className="text-[9px] text-purple-600 dark:text-purple-400">★</span>}
                        </div>
                        <div className={`flex-1 flex items-center justify-center ${turnoInfo.textColor} ${turnoInfo.darkText} mb-0.5`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        {turno !== 'L' && (
                          <div className="text-[9px] text-center text-muted-foreground mb-0.5">
                            {turnoHoras}h
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => setTurno(selectedTrabajador, day.iso, 'M')}
                              className={`text-[11px] px-1 py-0.5 rounded font-bold transition-all ${
                                turno === 'M'
                                  ? `${TURNOS['M'].color} text-white shadow-sm` 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              M
                            </button>
                            <button
                              onClick={() => setTurno(selectedTrabajador, day.iso, 'T')}
                              className={`text-[11px] px-1 py-0.5 rounded font-bold transition-all ${
                                turno === 'T'
                                  ? `${TURNOS['T'].color} text-white shadow-sm` 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              T
                            </button>
                          </div>
                          <button
                            onClick={() => setTurno(selectedTrabajador, day.iso, 'L')}
                            className={`w-full text-[11px] px-1 py-0.5 rounded font-bold transition-all ${
                              turno === 'L'
                                ? `${TURNOS['L'].color} text-white shadow-sm` 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Leyenda y herramientas */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(TURNOS).map(([key, turno]) => {
                const Icon = turno.icon
                return (
                  <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${turno.color} flex-shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1">{turno.label}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>Lun-Vie: {turno.horario} ({turno.hours}h)</div>
                        {turno.hours !== turno.hoursWeekend && (
                          <div>Sáb-Dom: {turno.horarioWeekend} ({turno.hoursWeekend}h)</div>
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
                  Lun-Vie Mañanas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
                  Lun-Vie Tardes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    daysInMonth.forEach(day => {
                      setTurno(selectedTrabajador, day.iso, 'L')
                    })
                  }}
                >
                  <Coffee className="h-3 w-3 mr-1" />
                  Todo Libre
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
