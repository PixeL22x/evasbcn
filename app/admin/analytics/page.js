"use client"

import { useState, useEffect } from "react"
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { TrendingUp, TrendingDown, Activity, Target, Clock, Users } from "lucide-react"

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      ventasPromedio: 0,
      tiempoPromedio: 0,
      eficienciaPromedio: 0,
      crecimientoVentas: 0
    },
    ventasPorHora: [],
    rendimientoPorTrabajador: [],
    tiemposPorTarea: [],
    tendenciasSemanales: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

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
                    <h1 className="text-3xl font-bold">Analytics Avanzado</h1>
                    <p className="text-muted-foreground">
                      Análisis detallado y métricas de rendimiento
                    </p>
                  </div>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 días</SelectItem>
                      <SelectItem value="30d">30 días</SelectItem>
                      <SelectItem value="90d">90 días</SelectItem>
                      <SelectItem value="1y">1 año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando analytics...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* KPIs principales */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Ventas Promedio</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(analyticsData.kpis.ventasPromedio)}</div>
                          <p className="text-xs text-muted-foreground">
                            <span className={analyticsData.kpis.crecimientoVentas >= 0 ? "text-green-600" : "text-red-600"}>
                              {analyticsData.kpis.crecimientoVentas >= 0 ? "+" : ""}{analyticsData.kpis.crecimientoVentas}%
                            </span> vs período anterior
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analyticsData.kpis.tiempoPromedio} min</div>
                          <p className="text-xs text-muted-foreground">
                            Por proceso de cierre
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                          <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analyticsData.kpis.eficienciaPromedio}%</div>
                          <p className="text-xs text-muted-foreground">
                            Tareas completadas correctamente
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Productividad</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">92%</div>
                          <p className="text-xs text-muted-foreground">
                            Índice de productividad
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Gráfico principal de ventas */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>Tendencia de Ventas</CardTitle>
                          <CardDescription>
                            Evolución de las ventas en el tiempo
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartAreaInteractive />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Gráficos de análisis detallado */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Ventas por Hora del Día</CardTitle>
                          <CardDescription>
                            Distribución de ventas durante el día
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData.ventasPorHora}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hora" />
                              <YAxis />
                              <Tooltip formatter={(value) => [formatCurrency(value), "Ventas"]} />
                              <Bar dataKey="ventas" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Rendimiento por Trabajador</CardTitle>
                          <CardDescription>
                            Comparativa de eficiencia del equipo
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={analyticsData.rendimientoPorTrabajador}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="cierres"
                              >
                                {analyticsData.rendimientoPorTrabajador.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Análisis de tiempos por tarea */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Tiempo Promedio por Tarea</CardTitle>
                        <CardDescription>
                          Identificación de cuellos de botella en el proceso
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={analyticsData.tiemposPorTarea} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="tarea" type="category" width={150} />
                            <Tooltip formatter={(value) => [`${value} min`, "Tiempo promedio"]} />
                            <Bar dataKey="tiempo" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Tendencias semanales */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Tendencias Semanales</CardTitle>
                        <CardDescription>
                          Patrones de actividad por día de la semana
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analyticsData.tendenciasSemanales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dia" />
                            <YAxis />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="cierres" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              name="Cierres"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="ventas" 
                              stroke="#82ca9d" 
                              strokeWidth={2}
                              name="Ventas (€)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
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
