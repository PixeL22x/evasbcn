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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Download, Calendar, TrendingUp, Clock, CheckCircle } from "lucide-react"

export default function ReportesPage() {
  const [reportData, setReportData] = useState({
    totalCierres: 0,
    ventasPromedio: 0,
    tiempoPromedio: 0,
    eficiencia: 0,
    cierresPorDia: [],
    trabajadorStats: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7d")

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/admin/reportes?range=${dateRange}`)
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

  const exportReport = () => {
    // Implementar exportación de reportes
    console.log('Exportando reporte...')
  }

  return (
    <AdminLayout>
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
          "--header-height": "4rem",
        }
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">Reportes y Analytics</h1>
                    <p className="text-muted-foreground">
                      Análisis detallado del rendimiento y estadísticas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
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
                    <Button onClick={exportReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Generando reporte...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Métricas principales */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Cierres</CardTitle>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{reportData.totalCierres}</div>
                          <p className="text-xs text-muted-foreground">
                            En el período seleccionado
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Ventas Promedio</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(reportData.ventasPromedio)}</div>
                          <p className="text-xs text-muted-foreground">
                            Por cierre completado
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{reportData.tiempoPromedio} min</div>
                          <p className="text-xs text-muted-foreground">
                            Duración del cierre
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{reportData.eficiencia}%</div>
                          <p className="text-xs text-muted-foreground">
                            Tareas completadas a tiempo
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Rendimiento por trabajador */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Rendimiento por Trabajador</CardTitle>
                        <CardDescription>
                          Estadísticas individuales del equipo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {reportData.trabajadorStats.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No hay datos disponibles para el período seleccionado
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {reportData.trabajadorStats.map((trabajador, index) => (
                              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                  <h4 className="font-medium">{trabajador.nombre}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {trabajador.cierresCompletados} cierres completados
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(trabajador.ventasPromedio)}</div>
                                  <div className="text-sm text-muted-foreground">Promedio ventas</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tendencias diarias */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Actividad Diaria</CardTitle>
                        <CardDescription>
                          Cierres completados por día
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {reportData.cierresPorDia.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No hay datos disponibles para el período seleccionado
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {reportData.cierresPorDia.map((dia, index) => (
                              <div key={index} className="flex items-center justify-between">
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
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AdminLayout>
  )
}
