"use client"

import React, { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { generateHoursPDF } from '@/lib/pdfHoursReport'
import {
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"

// ─── Rendimiento Tab (existing content) ───────────────────────────────────────

function RendimientoTab() {
  const [reportData, setReportData] = useState({
    totalCierres: 0,
    ventasPromedio: 0,
    tiempoPromedio: 0,
    eficiencia: 0,
    cierresPorDia: [],
    trabajadorStats: []
  })
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState("7d")

  const fetchReportData = async (range) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reportes?range=${range}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); fetchReportData(v) }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cierres</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalCierres}</div>
                <p className="text-xs text-muted-foreground">En el período seleccionado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.ventasPromedio)}</div>
                <p className="text-xs text-muted-foreground">Por cierre completado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.tiempoPromedio} min</div>
                <p className="text-xs text-muted-foreground">Duración del cierre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.eficiencia}%</div>
                <p className="text-xs text-muted-foreground">Tareas completadas a tiempo</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Trabajador</CardTitle>
              <CardDescription>Estadísticas individuales del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.trabajadorStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay datos disponibles para el período seleccionado
                </p>
              ) : (
                <div className="space-y-4">
                  {reportData.trabajadorStats.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{t.nombre}</h4>
                        <p className="text-sm text-muted-foreground">{t.cierresCompletados} cierres completados</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(t.ventasPromedio)}</div>
                        <div className="text-sm text-muted-foreground">Promedio ventas</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Diaria</CardTitle>
              <CardDescription>Cierres completados por día</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.cierresPorDia.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay datos disponibles para el período seleccionado
                </p>
              ) : (
                <div className="space-y-2">
                  {reportData.cierresPorDia.map((dia, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{formatDate(dia.fecha)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(dia.cierres / Math.max(...reportData.cierresPorDia.map(d => d.cierres))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{dia.cierres}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── Fin de Mes Tab ────────────────────────────────────────────────────────────

const MESES = [
  { value: "1", label: "Enero" }, { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" }, { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
  { value: "7", label: "Julio" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" }, { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
]

const CATEGORIAS_COLORES = {
  cambio_turno: "bg-blue-100 text-blue-800",
  horario: "bg-purple-100 text-purple-800",
  incidencia: "bg-red-100 text-red-800",
  equipo: "bg-green-100 text-green-800",
  financiero: "bg-yellow-100 text-yellow-800",
  general: "bg-gray-100 text-gray-800",
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const TURNO_LABELS = { M: 'Mañana', T: 'Tarde', L: 'Libre' }
const TURNO_COLORS = { M: 'bg-blue-100 text-blue-700', T: 'bg-orange-100 text-orange-700', L: 'bg-gray-100 text-gray-500' }

function FinDeMesTab() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (nombre) => setExpanded(prev => ({ ...prev, [nombre]: !prev[nombre] }))

  // Años disponibles: 3 años atrás hasta el actual
  const years = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i))

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/admin/reports/hours?month=${month}&year=${year}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al generar el informe')
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const mesLabel = MESES.find(m => m.value === month)?.label || ''

  return (
    <div className="space-y-6">
      {/* Selector mes / año */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar período
          </CardTitle>
          <CardDescription>
            Genera el informe detallado de horas y análisis IA para el mes seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mes</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Año</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchReport} disabled={loading} className="gap-2">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generar informe</>
              )}
            </Button>
            {data && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => generateHoursPDF(data)}
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Resumen rápido */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Trabajadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.staffStats.length}</div>
                <p className="text-xs text-muted-foreground">Con horas asignadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Horas totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalHours?.toFixed(1) ?? '—'}</div>
                <p className="text-xs text-muted-foreground">Horas ajustadas del equipo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Notas del mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.notes?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">Incidencias registradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de horas por trabajador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Horas por trabajador — {mesLabel} {year}
              </CardTitle>
              <CardDescription>
                Basado en el horario planificado. Haz clic en un trabajador para ver el desglose diario.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">Trabajador</th>
                      <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Turnos</th>
                      <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Horas plan.</th>
                      <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Ajuste IA</th>
                      <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total final</th>
                      <th className="w-8 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffStats.map((w, i) => (
                      <React.Fragment key={i}>
                        {/* Worker row */}
                        <tr
                          onClick={() => toggleExpand(w.nombre)}
                          className="border-b hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 font-semibold">{w.nombre}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{w.turnos}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                            {(w.horasOriginales ?? w.horas).toFixed(1)} h
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {w.ajuste != null ? (
                              <div>
                                <span className={`inline-flex items-center gap-1 font-medium ${w.ajuste < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {w.ajuste < 0 ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                                  {w.ajuste > 0 ? '+' : ''}{w.ajuste.toFixed(1)} h
                                </span>
                                {w.motivoAjuste && (
                                  <div className="text-xs text-muted-foreground">{w.motivoAjuste}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{w.horas.toFixed(1)} h</td>
                          <td className="px-2 py-3 text-center text-muted-foreground text-xs">
                            {expanded[w.nombre] ? '▲' : '▼'}
                          </td>
                        </tr>

                        {/* Daily breakdown */}
                        {expanded[w.nombre] && w.detalles?.length > 0 && (
                          <tr key={`d-${i}`} className="border-b bg-muted/20">
                            <td colSpan={6} className="px-6 py-3">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-muted-foreground border-b">
                                    <th className="text-left py-1.5 pr-4 font-medium">Fecha</th>
                                    <th className="text-left py-1.5 pr-4 font-medium">Día</th>
                                    <th className="text-left py-1.5 pr-4 font-medium">Turno</th>
                                    <th className="text-right py-1.5 font-medium">Horas</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                  {w.detalles.map((d, j) => {
                                    const date = new Date(d.fecha + 'T00:00:00Z')
                                    const dow = date.getUTCDay()
                                    return (
                                      <tr key={j} className="hover:bg-muted/30">
                                        <td className="py-1.5 pr-4 text-muted-foreground">
                                          {date.getUTCDate().toString().padStart(2, '0')}/{(date.getUTCMonth() + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="py-1.5 pr-4 text-muted-foreground">{DIAS_SEMANA[dow]}</td>
                                        <td className="py-1.5 pr-4">
                                          <span className={`px-2 py-0.5 rounded font-medium ${TURNO_COLORS[d.turno] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {TURNO_LABELS[d.turno] ?? d.turno}
                                          </span>
                                        </td>
                                        <td className="py-1.5 text-right font-semibold">{d.horas} h</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t">
                                    <td colSpan={3} className="pt-2 text-muted-foreground">
                                      Subtotal planificado: <span className="font-semibold text-foreground">{(w.horasOriginales ?? w.horas).toFixed(1)} h</span>
                                      {w.ajuste != null && (
                                        <span className={`ml-3 font-medium ${w.ajuste < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          {w.ajuste > 0 ? '+' : ''}{w.ajuste.toFixed(1)} h ajuste ({w.motivoAjuste})
                                        </span>
                                      )}
                                    </td>
                                    <td className="pt-2 text-right font-bold">{w.horas.toFixed(1)} h</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-3">Total equipo</td>
                      <td colSpan={3} />
                      <td className="px-4 py-3 text-right whitespace-nowrap">{data.totalHours?.toFixed(1)} h</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>


          {/* Notas del mes */}
          {data.notes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas e incidencias — {mesLabel} {year}
                </CardTitle>
                <CardDescription>
                  Notas del dashboard que han podido afectar a las horas del mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.notes.map((nota, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-lg border bg-muted/20">
                      <div className="text-sm text-muted-foreground w-16 flex-shrink-0 pt-0.5">
                        {new Date(nota.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm">{nota.titulo}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIAS_COLORES[nota.categoria] ?? 'bg-gray-100 text-gray-700'}`}>
                            {nota.categoria}
                          </span>
                          {nota.prioridad === 'alta' && (
                            <Badge variant="destructive" className="text-xs py-0">Alta</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{nota.contenido}</p>
                        {nota.trabajadorRelacionado && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {nota.trabajadorRelacionado}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análisis IA */}
          {data.aiAnalysis && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Sparkles className="h-5 w-5" />
                  Análisis IA — {mesLabel} {year}
                </CardTitle>
                <CardDescription>
                  Generado automáticamente por Gemini analizando horas, ajustes y notas del mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  {data.aiAnalysis.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 last:mb-0 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}


      {
        !data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <Calendar className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Selecciona un mes y genera el informe</p>
            <p className="text-sm">El informe incluye horas planificadas, ajustes por incidencias y análisis IA</p>
          </div>
        )
      }
    </div >
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReportesPage() {
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
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold">Reportes y Analytics</h1>
                  <p className="text-muted-foreground">
                    Análisis detallado del rendimiento, estadísticas y cierre mensual
                  </p>
                </div>

                <Tabs defaultValue="rendimiento" className="space-y-6">
                  <TabsList className="grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="rendimiento" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Rendimiento
                    </TabsTrigger>
                    <TabsTrigger value="fin-de-mes" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fin de mes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="rendimiento">
                    <RendimientoTab />
                  </TabsContent>

                  <TabsContent value="fin-de-mes">
                    <FinDeMesTab />
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
