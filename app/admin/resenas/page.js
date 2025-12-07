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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { Star, Search, Filter, TrendingUp, Trash2 } from "lucide-react"

export default function ResenasPage() {
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalResenas, setTotalResenas] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroTrabajador, setFiltroTrabajador] = useState("todos")
  const [filtroCalificacion, setFiltroCalificacion] = useState("todos")
  const [trabajadores, setTrabajadores] = useState([])
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    fetchResenas()
    fetchTrabajadores()
  }, [])

  const fetchTrabajadores = async () => {
    try {
      const response = await fetch('/api/trabajadores')
      if (response.ok) {
        const data = await response.json()
        setTrabajadores(data.trabajadores || [])
      }
    } catch (error) {
      console.error('Error fetching trabajadores:', error)
    }
  }

  const fetchResenas = async (reset = true) => {
    try {
      let skip = 0
      
      if (reset) {
        setLoading(true)
        setCurrentPage(0)
        setResenas([]) // Limpiar reseñas antes de cargar nuevas
        skip = 0
      } else {
        setLoadingMore(true)
        // Calcular skip basado en el número actual de reseñas
        skip = resenas.length
      }
      
      let url = '/api/resenas?'
      const limit = 5
      
      url += `limit=${limit}&skip=${skip}&`
      
      if (filtroTrabajador !== 'todos') {
        url += `trabajadorId=${filtroTrabajador}&`
      }
      
      if (filtroCalificacion !== 'todos') {
        url += `calificacion=${filtroCalificacion}&`
      }
      
      if (fechaDesde) {
        url += `fechaDesde=${fechaDesde}&`
      }
      
      if (fechaHasta) {
        url += `fechaHasta=${fechaHasta}&`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const resenasData = data.resenas || []
        
        if (reset) {
          setResenas(resenasData)
          setCurrentPage(1)
        } else {
          setResenas(prev => [...prev, ...resenasData])
          setCurrentPage(prev => prev + 1)
        }
        
        setTotalResenas(data.total || 0)
        setHasMore(data.hasMore || false)
      } else {
        console.error('Error response:', response.status)
      }
    } catch (error) {
      console.error('Error fetching resenas:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreResenas = () => {
    fetchResenas(false)
  }

  useEffect(() => {
    fetchResenas(true)
  }, [filtroTrabajador, filtroCalificacion, fechaDesde, fechaHasta])

  const handleDeleteResena = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña? Esta acción no se puede deshacer.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/resenas/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchResenas()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar la reseña')
      }
    } catch (error) {
      console.error('Error deleting resena:', error)
      alert('Error al eliminar la reseña')
    }
  }

  const filteredResenas = resenas.filter(resena =>
    resena.trabajador?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCalificacionBadge = (calificacion) => {
    const colors = {
      5: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      4: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      2: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }
    return (
      <Badge className={colors[calificacion] || colors[3]}>
        {calificacion} ⭐
      </Badge>
    )
  }

  const getCalificacionColor = (cal) => {
    if (cal === 5) return 'text-yellow-400'
    if (cal >= 3) return 'text-orange-400'
    return 'text-red-400' // 1 y 2 estrellas
  }

  const renderEstrellas = (calificacion) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: calificacion }, (_, i) => (
          <span
            key={i}
            className={`text-lg ${getCalificacionColor(calificacion)}`}
          >
            ⭐
          </span>
        ))}
      </div>
    )
  }

  // Calcular estadísticas
  const estadisticas = {
    total: resenas.length,
    promedio: resenas.length > 0 
      ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(2)
      : 0,
    porCalificacion: {
      5: resenas.filter(r => r.calificacion === 5).length,
      4: resenas.filter(r => r.calificacion === 4).length,
      3: resenas.filter(r => r.calificacion === 3).length,
      2: resenas.filter(r => r.calificacion === 2).length,
      1: resenas.filter(r => r.calificacion === 1).length,
    }
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
                    <h1 className="text-3xl font-bold">Gestión de Reseñas</h1>
                    <p className="text-muted-foreground">
                      Visualiza y gestiona todas las reseñas registradas por los trabajadores
                    </p>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Reseñas</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{estadisticas.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{estadisticas.promedio}</div>
                      <p className="text-xs text-muted-foreground">Calificación promedio</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">5 Estrellas</CardTitle>
                      <Star className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{estadisticas.porCalificacion[5]}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">1-2 Estrellas</CardTitle>
                      <Star className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {estadisticas.porCalificacion[1] + estadisticas.porCalificacion[2]}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar trabajador..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={filtroTrabajador} onValueChange={setFiltroTrabajador}>
                        <SelectTrigger>
                          <SelectValue placeholder="Trabajador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los trabajadores</SelectItem>
                          {trabajadores.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filtroCalificacion} onValueChange={setFiltroCalificacion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Calificación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas las calificaciones</SelectItem>
                          <SelectItem value="5">5 Estrellas</SelectItem>
                          <SelectItem value="4">4 Estrellas</SelectItem>
                          <SelectItem value="3">3 Estrellas</SelectItem>
                          <SelectItem value="2">2 Estrellas</SelectItem>
                          <SelectItem value="1">1 Estrella</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        placeholder="Fecha desde"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                      />
                      <Input
                        type="date"
                        placeholder="Fecha hasta"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de reseñas */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando reseñas...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResenas.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-8">
                          <p className="text-muted-foreground">
                            {searchTerm || filtroTrabajador !== 'todos' || filtroCalificacion !== 'todos'
                              ? 'No se encontraron reseñas con los filtros aplicados'
                              : 'No hay reseñas registradas'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredResenas.map((resena) => (
                        <Card key={resena.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {resena.trabajador?.nombre || 'Trabajador desconocido'}
                                  </h3>
                                  {getCalificacionBadge(resena.calificacion)}
                                </div>
                                <div className="mb-3">
                                  {renderEstrellas(resena.calificacion)}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>
                                    <span className="font-medium">Fecha de la reseña:</span>{' '}
                                    {new Date(resena.fechaResena).toLocaleDateString('es-ES')}
                                  </p>
                                  <p>
                                    <span className="font-medium">Registrado el:</span>{' '}
                                    {new Date(resena.fechaRegistro).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteResena(resena.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {/* Botón Cargar Más */}
                {!loading && filteredResenas.length > 0 && hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={loadMoreResenas}
                      disabled={loadingMore}
                      variant="outline"
                      className="min-w-[200px]"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Cargando...
                        </>
                      ) : (
                        `Cargar más (${totalResenas - filteredResenas.length} restantes)`
                      )}
                    </Button>
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

