"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from '../../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, Moon, Search, Download, Users, CalendarCheck, XCircle, AlertCircle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ─── Helpers ────────────────────────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const DIAS_SEMANA_CORTO = ["D", "L", "M", "X", "J", "V", "S"]

function getDiaSemana(year, month, dia) {
  return new Date(year, month - 1, dia).getDay()
}

function esFinDeSemana(year, month, dia) {
  const d = getDiaSemana(year, month, dia)
  return d === 0 || d === 6
}

// Estado → clases de color y contenido
const ESTADO_CONFIG = {
  presente: {
    bg: 'bg-green-500/20 border border-green-500/40',
    bgFds: 'bg-green-500/30 border border-green-500/50',
    icon: <Sun className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />,
    label: 'Presente',
  },
  ausente: {
    bg: 'bg-red-500/20 border border-red-500/40',
    bgFds: 'bg-red-500/30 border border-red-500/50',
    icon: <XCircle className="h-2.5 w-2.5 text-red-500" />,
    label: 'Ausente',
  },
  extra: {
    bg: 'bg-amber-500/20 border border-amber-500/40',
    bgFds: 'bg-amber-500/30 border border-amber-500/50',
    icon: <AlertCircle className="h-2.5 w-2.5 text-amber-500" />,
    label: 'Extra (no planificado)',
  },
  libre: {
    bg: 'bg-muted/20',
    bgFds: 'bg-muted/50',
    icon: null,
    label: 'Libre',
  },
}

// Icono de turno planificado
function TurnoIcon({ turno, size = 'h-2.5 w-2.5' }) {
  if (turno === 'M') return <Sun className={`${size} text-evas-pink`} />
  if (turno === 'T' || turno === 'N') return <Moon className={`${size} text-evas-blue`} />
  return null
}

// ─── Celda del calendario ────────────────────────────────────────────────────

function CeldaDia({ diaDato, dia, year, month }) {
  if (!diaDato) return <div className="w-full h-8 rounded bg-muted/20" />

  const { planificado, cierres, estado } = diaDato
  const fds = esFinDeSemana(year, month, dia)
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.libre

  const title = `${cfg.label}${planificado ? ` (${planificado === 'M' ? 'Mañana' : 'Tarde'} planificado)` : ''}${cierres?.length ? ` · ${cierres.length} cierre(s)` : ''}`

  return (
    <div
      className={`w-full h-8 rounded flex items-center justify-center gap-0.5 transition-opacity ${fds ? cfg.bgFds : cfg.bg}`}
      title={title}
    >
      {/* Icono de estado principal */}
      {cfg.icon}
      {/* Icono de turno planificado (pequeño, encima) */}
      {planificado && estado !== 'libre' && (
        <TurnoIcon turno={planificado} size="h-2 w-2 opacity-60" />
      )}
    </div>
  )
}

// ─── Tarjeta mobile por trabajador ───────────────────────────────────────────

function TarjetaTrabajador({ trabajador, diasEnMes, year, month }) {
  const { nombre, dias, resumen } = trabajador

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {nombre.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm">{nombre}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="text-[10px] px-1.5 py-0 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
              ✅ {resumen.totalConCierre}
            </Badge>
            {resumen.totalAusencias > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">
                ❌ {resumen.totalAusencias}
              </Badge>
            )}
            {resumen.totalExtras > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                ⚠️ {resumen.totalExtras}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold">
              {resumen.totalPlanificados} plan.
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${diasEnMes}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: diasEnMes }, (_, i) => i + 1).map(dia => (
            <div key={dia} className="flex flex-col items-center gap-0.5">
              <span className={`text-[7px] font-medium leading-none ${esFinDeSemana(year, month, dia) ? 'text-evas-pink/60' : 'text-muted-foreground/40'}`}>
                {dia}
              </span>
              <CeldaDia diaDato={dias[dia]} dia={dia} year={year} month={month} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Fila desktop ─────────────────────────────────────────────────────────────

function FilaTrabajador({ trabajador, diasEnMes, year, month }) {
  const { nombre, dias, resumen } = trabajador

  return (
    <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
      <td className="px-3 py-1.5 font-medium text-sm whitespace-nowrap sticky left-0 bg-card z-10 border-r border-border/30" style={{ minWidth: '100px', maxWidth: '130px' }}>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-xs">{nombre}</span>
        </div>
      </td>

      {Array.from({ length: diasEnMes }, (_, i) => i + 1).map(dia => (
        <td key={dia} className="text-center" style={{ minWidth: '26px', width: '26px', padding: '2px 1px' }}>
          <CeldaDia diaDato={dias[dia]} dia={dia} year={year} month={month} />
        </td>
      ))}

      <td className="px-2 py-1.5 whitespace-nowrap sticky right-0 bg-card z-10 border-l border-border/30">
        <div className="flex flex-col gap-0.5 text-[10px]">
          <span className="text-green-600 dark:text-green-400 font-semibold">✅ {resumen.totalConCierre}/{resumen.totalPlanificados}</span>
          {resumen.totalAusencias > 0 && (
            <span className="text-red-500 font-semibold">❌ {resumen.totalAusencias}</span>
          )}
          {resumen.totalExtras > 0 && (
            <span className="text-amber-500 font-semibold">⚠️ {resumen.totalExtras}</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function AsistenciaPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [trabajadorFiltro, setTrabajadorFiltro] = useState("todos")
  const [trabajadoresLista, setTrabajadoresLista] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  useEffect(() => {
    fetch('/api/cierre/trabajadores')
      .then(r => r.json())
      .then(d => setTrabajadoresLista(d.trabajadores || []))
      .catch(() => {})
  }, [])

  const fetchAsistencia = useCallback(async () => {
    setLoading(true)
    try {
      const mes = `${year}-${String(month).padStart(2, '0')}`
      const params = new URLSearchParams({ mes, trabajador: trabajadorFiltro })
      const res = await fetch(`/api/admin/reports/asistencia?${params}`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error('Error cargando asistencia:', e)
    } finally {
      setLoading(false)
    }
  }, [year, month, trabajadorFiltro])

  useEffect(() => { fetchAsistencia() }, [fetchAsistencia])

  const diasEnMes = data?.diasEnMes || new Date(year, month, 0).getDate()

  const cabeceraDias = Array.from({ length: diasEnMes }, (_, i) => {
    const d = i + 1
    const ds = getDiaSemana(year, month, d)
    return { dia: d, diaSemana: DIAS_SEMANA_CORTO[ds], fds: ds === 0 || ds === 6 }
  })

  // KPIs globales
  const totalTrabajadores = data?.trabajadores?.length || 0
  const totalPresentes = data?.trabajadores?.reduce((a, t) => a + t.resumen.totalConCierre, 0) || 0
  const totalAusencias = data?.trabajadores?.reduce((a, t) => a + t.resumen.totalAusencias, 0) || 0
  const totalExtras = data?.trabajadores?.reduce((a, t) => a + t.resumen.totalExtras, 0) || 0

  const exportarPDF = () => {
    if (!data) return
    
    const doc = new jsPDF('landscape')
    
    doc.setFontSize(16)
    doc.text(`Reporte de Asistencia - ${MESES[month - 1]} ${year}`, 14, 15)
    
    doc.setFontSize(10)
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22)

    const columns = [
      'Trabajador', 
      ...cabeceraDias.map(c => `${c.dia}`), 
      'P', // Presentes
      'A', // Ausencias
      'E', // Extras
      'T'  // Planificados
    ]

    const rows = data.trabajadores.map(t => {
      const celdas = cabeceraDias.map(c => {
        const d = t.dias[c.dia]
        if (!d) return ''
        return { presente: 'P', ausente: 'A', extra: 'E', libre: '' }[d.estado] || ''
      })
      return [
        t.nombre, 
        ...celdas, 
        t.resumen.totalConCierre.toString(), 
        t.resumen.totalAusencias.toString(), 
        t.resumen.totalExtras.toString(), 
        t.resumen.totalPlanificados.toString()
      ]
    })

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 30 } // Trabajador name slightly wider
      },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: function(data) {
        // Colorize P, A, E in the calendar section
        if (data.section === 'body' && data.column.index > 0 && data.column.index <= diasEnMes) {
          if (data.cell.raw === 'P') {
            data.cell.styles.textColor = [34, 197, 94] // green-500
            data.cell.styles.fontStyle = 'bold'
          } else if (data.cell.raw === 'A') {
            data.cell.styles.textColor = [239, 68, 68] // red-500
            data.cell.styles.fontStyle = 'bold'
          } else if (data.cell.raw === 'E') {
            data.cell.styles.textColor = [245, 158, 11] // amber-500
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    })

    doc.save(`asistencia-${year}-${String(month).padStart(2, '0')}.pdf`)
  }

  return (
    <AdminLayout>
      <SidebarProvider style={{ "--sidebar-width": "19rem", "--header-height": "4rem" }}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <div className="w-full px-3 sm:px-4 py-4 sm:py-6 max-w-[1400px] mx-auto">

                {/* ── Cabecera ── */}
                <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 leading-tight">
                      <CalendarCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                      Asistencia Mensual
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Planning vs cierres reales · confirma quién trabajó cada día
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportarPDF} disabled={!data || loading} className="shrink-0">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar PDF</span>
                  </Button>
                </div>

                {/* ── Filtros ── */}
                <Card className="mb-4 sm:mb-6 border-none bg-muted/40 shadow-sm">
                  <CardContent className="pt-4 pb-3 px-3 sm:px-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                        <SelectTrigger className="h-10 bg-background dark:border-white/10 text-sm">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {MESES.map((m, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                        <SelectTrigger className="h-10 bg-background dark:border-white/10 text-sm">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={trabajadorFiltro} onValueChange={setTrabajadorFiltro}>
                        <SelectTrigger className="h-10 bg-background dark:border-white/10 text-sm col-span-2 sm:col-span-1">
                          <SelectValue placeholder="Trabajador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {trabajadoresLista.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      {MESES[month - 1]} {year}
                    </p>
                  </CardContent>
                </Card>

                {/* ── KPIs ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: 'Trabajadores', value: totalTrabajadores, icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Días presentes', value: totalPresentes, icon: CalendarCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/5' },
                    { label: 'Ausencias', value: totalAusencias, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/5' },
                    { label: 'Turnos extra', value: totalExtras, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className={`border bg-card`}>
                      <CardContent className={`pt-4 pb-3 px-3 sm:px-4 ${bg} rounded-xl`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium leading-tight">{label}</p>
                            <div className={`text-xl sm:text-2xl font-bold mt-1 ${color}`}>
                              {loading ? <Skeleton className="h-6 w-10" /> : value}
                            </div>
                          </div>
                          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${color} opacity-20`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* ── Leyenda ── */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-green-500/20 border border-green-500/40" />
                    Presente (planificado + cierre)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500/40" />
                    Ausente (planificado sin cierre)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40" />
                    Extra (cierre sin planificar)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-muted/40" />
                    Libre
                  </span>
                </div>

                {/* ── Vista MOBILE ── */}
                <div className="block sm:hidden space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }, (_, i) => (
                      <Card key={i} className="border bg-card">
                        <CardContent className="pt-4 pb-3 px-3">
                          <Skeleton className="h-5 w-32 mb-3" />
                          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(31, minmax(0,1fr))' }}>
                            {Array.from({ length: 31 }, (_, j) => <Skeleton key={j} className="h-7 w-full rounded" />)}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : data?.trabajadores?.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                      <Search className="h-10 w-10 opacity-20" />
                      <p className="font-medium text-sm text-center">No hay datos en este periodo</p>
                    </div>
                  ) : (
                    data?.trabajadores?.map(t => (
                      <TarjetaTrabajador key={t.nombre} trabajador={t} diasEnMes={diasEnMes} year={year} month={month} />
                    ))
                  )}
                </div>

                {/* ── Vista DESKTOP ── */}
                <div className="hidden sm:block">
                  <Card className="border bg-card overflow-hidden">
                    <CardHeader className="pb-3 border-b px-4 pt-4">
                      <CardTitle className="text-sm sm:text-base">
                        Calendario — {MESES[month - 1]} {year}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Planning cruzado con cierres reales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="text-sm border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground sticky left-0 bg-muted/30 z-10 border-r border-border/30" style={{ minWidth: '100px' }}>
                                Trabajador
                              </th>
                              {cabeceraDias.map(({ dia, diaSemana, fds }) => (
                                <th
                                  key={dia}
                                  className={`py-2 text-center font-medium text-[10px] ${fds ? 'text-evas-pink/70' : 'text-muted-foreground'}`}
                                  style={{ minWidth: '26px', width: '26px' }}
                                >
                                  <div className="leading-none">{dia}</div>
                                  <div className={`text-[8px] mt-0.5 ${fds ? 'text-evas-pink/50' : 'text-muted-foreground/40'}`}>{diaSemana}</div>
                                </th>
                              ))}
                              <th className="px-2 py-2 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground sticky right-0 bg-muted/30 z-10 border-l border-border/30 whitespace-nowrap">
                                Resumen
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              Array.from({ length: 4 }, (_, i) => (
                                <tr key={i} className="border-b border-border/30">
                                  <td className="px-3 py-2 sticky left-0 bg-card border-r border-border/30"><Skeleton className="h-5 w-20" /></td>
                                  {Array.from({ length: diasEnMes }, (_, j) => (
                                    <td key={j} style={{ padding: '3px 1px' }}><Skeleton className="h-7 w-5 rounded" /></td>
                                  ))}
                                  <td className="px-2 py-2 sticky right-0 bg-card border-l border-border/30"><Skeleton className="h-5 w-14" /></td>
                                </tr>
                              ))
                            ) : data?.trabajadores?.length === 0 ? (
                              <tr>
                                <td colSpan={diasEnMes + 2} className="py-16 text-center">
                                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Search className="h-10 w-10 opacity-20" />
                                    <p className="font-medium">No hay datos para este periodo</p>
                                    <p className="text-xs">Comprueba que los trabajadores tienen planning configurado</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              data?.trabajadores?.map(t => (
                                <FilaTrabajador key={t.nombre} trabajador={t} diasEnMes={diasEnMes} year={year} month={month} />
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
