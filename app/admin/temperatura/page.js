'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Thermometer, Calendar, Users, AlertTriangle, TrendingUp, RefreshCw, Snowflake, AlertCircle, Flame, Wind } from "lucide-react"
import AdminLayout from '../../../components/AdminLayout'

export default function TemperaturaAdmin() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [trabajadorFiltro, setTrabajadorFiltro] = useState('todos')
  const [trabajadores, setTrabajadores] = useState([])
  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    registrosHoy: 0,
    temperaturaPromedio: 0,
    alertas: 0
  })

  useEffect(() => {
    loadTrabajadores()
    loadRegistros()
  }, [])

  useEffect(() => {
    loadRegistros()
  }, [fechaFiltro, trabajadorFiltro])

  const loadTrabajadores = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/trabajadores`)
      if (response.ok) {
        const data = await response.json()
        setTrabajadores(data.trabajadores)
      }
    } catch (error) {
      console.error('Error al cargar trabajadores:', error)
    }
  }

  const loadRegistros = async () => {
    setLoading(true)
    try {
      let url = `${window.location.origin}/api/temperatura?fecha=${fechaFiltro}`
      if (trabajadorFiltro && trabajadorFiltro !== 'todos') {
        url += `&trabajadorId=${trabajadorFiltro}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRegistros(data.registros)
        calcularEstadisticas(data.registros)
      }
    } catch (error) {
      console.error('Error al cargar registros:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticas = (registros) => {
    const hoy = new Date().toISOString().split('T')[0]
    const registrosHoy = registros.filter(r => 
      new Date(r.fecha).toISOString().split('T')[0] === hoy
    )
    
    const temperaturas = registros.map(r => r.temperatura)
    const promedio = temperaturas.length > 0 
      ? temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length 
      : 0
    
    const alertas = registros.filter(r => r.temperatura > -2 || r.temperatura < -18).length

    setEstadisticas({
      totalRegistros: registros.length,
      registrosHoy: registrosHoy.length,
      temperaturaPromedio: promedio,
      alertas: alertas
    })
  }

  const getTemperaturaColor = (temp) => {
    if (temp < -18) return 'text-blue-600 bg-blue-100'
    if (temp < -10) return 'text-green-600 bg-green-100'
    if (temp < -2) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getTemperaturaIcon = (temp) => {
    if (temp < -18) return <Wind className="h-4 w-4" />
    if (temp < -10) return <Snowflake className="h-4 w-4" />
    if (temp < -2) return <AlertCircle className="h-4 w-4" />
    return <Flame className="h-4 w-4" />
  }

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
                <div className="space-y-6">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Thermometer className="h-8 w-8 text-blue-600" />
                        Temperatura Vitrina
                      </h1>
                      <p className="text-muted-foreground">
                        Monitoreo y control de temperatura de la vitrina de helados
                      </p>
                    </div>
                    <Button onClick={loadRegistros} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{estadisticas.totalRegistros}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registros Hoy</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{estadisticas.registrosHoy}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Temp. Promedio</CardTitle>
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {estadisticas.temperaturaPromedio.toFixed(1)}°C
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{estadisticas.alertas}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filtros */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Filtros</CardTitle>
                      <CardDescription>
                        Filtra los registros por fecha y trabajador
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fecha">Fecha</Label>
                          <Input
                            id="fecha"
                            type="date"
                            value={fechaFiltro}
                            onChange={(e) => setFechaFiltro(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="trabajador">Trabajador</Label>
                          <Select value={trabajadorFiltro} onValueChange={setTrabajadorFiltro}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos los trabajadores" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos los trabajadores</SelectItem>
                              {trabajadores.map((trabajador) => (
                                <SelectItem key={trabajador.id} value={trabajador.id}>
                                  {trabajador.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-end">
                          <Button onClick={loadRegistros} className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualizar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabla de registros */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Registros de Temperatura</CardTitle>
                      <CardDescription>
                        Historial completo de mediciones de temperatura
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="ml-2 text-muted-foreground">Cargando registros...</span>
                        </div>
                      ) : registros.length === 0 ? (
                        <div className="text-center py-8">
                          <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay registros para la fecha seleccionada</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium">Trabajador</th>
                                <th className="text-left py-3 px-4 font-medium">Fecha</th>
                                <th className="text-left py-3 px-4 font-medium">Hora</th>
                                <th className="text-left py-3 px-4 font-medium">Temperatura</th>
                                <th className="text-left py-3 px-4 font-medium">Estado</th>
                                <th className="text-left py-3 px-4 font-medium">Observaciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {registros.map((registro) => (
                                <tr key={registro.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4 font-medium">
                                    {registro.trabajador.nombre}
                                  </td>
                                  <td className="py-3 px-4 text-muted-foreground">
                                    {formatFecha(registro.fecha)}
                                  </td>
                                  <td className="py-3 px-4 text-muted-foreground">
                                    {registro.hora}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className={getTemperaturaColor(registro.temperatura)}>
                                      <span className="mr-1">{getTemperaturaIcon(registro.temperatura)}</span>
                                      {registro.temperatura}°C
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-muted-foreground">
                                    {registro.temperatura < -18 ? 'Muy Frío' :
                                     registro.temperatura < -10 ? 'Ideal' :
                                     registro.temperatura < -2 ? 'Aceptable' : 'Peligroso'}
                                  </td>
                                  <td className="py-3 px-4 text-muted-foreground">
                                    {registro.observaciones || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Información adicional */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rangos de Temperatura</CardTitle>
                      <CardDescription>
                        Guía de interpretación de las mediciones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
                          <Wind className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Muy Frío</p>
                            <p className="text-sm text-blue-700">&lt; -18°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
                          <Snowflake className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Ideal</p>
                            <p className="text-sm text-green-700">-18°C a -10°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50">
                          <AlertCircle className="h-6 w-6 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-900">Aceptable</p>
                            <p className="text-sm text-yellow-700">-10°C a -2°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50">
                          <Flame className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="font-medium text-red-900">Peligroso</p>
                            <p className="text-sm text-red-700">&gt; -2°C</p>
                          </div>
                        </div>
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
