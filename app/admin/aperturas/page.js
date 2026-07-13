"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight, Eye, Trash2, Sun } from "lucide-react"

export default function AperturasPage() {
  const [aperturas, setAperturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApertura, setSelectedApertura] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 9

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [turnoFilter, setTurnoFilter] = useState("todos")
  const [dateRangeFilter, setDateRangeFilter] = useState("todos")
  const [trabajadorFilter, setTrabajadorFilter] = useState("todos")
  const [trabajadores, setTrabajadores] = useState([])

  useEffect(() => {
    loadAperturas()
    loadTrabajadores()
  }, [currentPage, turnoFilter, dateRangeFilter, trabajadorFilter])

  const loadAperturas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        turno: turnoFilter,
        dateRange: dateRangeFilter,
        trabajador: trabajadorFilter,
        search: searchTerm
      })
      const response = await fetch(`/api/apertura?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAperturas(data.aperturas || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalItems(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error cargando aperturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrabajadores = async () => {
    try {
      const res = await fetch('/api/trabajadores')
      if (res.ok) {
        const data = await res.json()
        setTrabajadores(data.trabajadores || [])
      }
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta apertura? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/apertura/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadAperturas()
        if (selectedApertura?.id === id) {
          setShowDetails(false)
          setSelectedApertura(null)
        }
      }
    } catch (e) {
      console.error('Error eliminando apertura:', e)
    }
  }

  const formatDuration = (apertura) => {
    if (!apertura.fechaFin || !apertura.fechaInicio) return '—'
    const ms = new Date(apertura.fechaFin) - new Date(apertura.fechaInicio)
    const mins = Math.floor(ms / 60000)
    const hours = Math.floor(mins / 60)
    const remainMins = mins % 60
    if (hours > 0) return `${hours}h ${remainMins}min`
    return `${mins} min`
  }

  const completedCount = aperturas.filter(a => a.completado).length
  const pendingCount = aperturas.filter(a => !a.completado).length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                🌅 Aperturas de Tienda
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Historial de aperturas completadas por los trabajadores
              </p>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {totalItems} registros
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="text-3xl">🌅</div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{totalItems}</p>
                  <p className="text-sm text-amber-600">Total aperturas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                  <p className="text-sm text-green-600">Completadas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
                  <p className="text-sm text-orange-600">Pendientes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar trabajador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAperturas()}
                    className="flex-1"
                  />
                </div>
                <Select value={trabajadorFilter} onValueChange={v => { setTrabajadorFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trabajador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {trabajadores.map(t => (
                      <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={turnoFilter} onValueChange={v => { setTurnoFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRangeFilter} onValueChange={v => { setDateRangeFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todo</SelectItem>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            {/* Lista de aperturas */}
            <div className={`flex-1 ${showDetails ? 'hidden lg:block' : ''}`}>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded mb-1 w-2/3"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : aperturas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🌅</div>
                  <h3 className="text-lg font-semibold text-gray-700">No hay aperturas registradas</h3>
                  <p className="text-sm text-gray-500 mt-1">Las aperturas aparecerán aquí cuando los trabajadores las completen.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aperturas.map((apertura) => {
                      const tareasCompletadas = apertura.tareas?.filter(t => t.completada).length || 0
                      const totalTareas = apertura.tareas?.length || 0
                      const progreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0
                      const isSelected = selectedApertura?.id === apertura.id

                      return (
                        <Card
                          key={apertura.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => { setSelectedApertura(apertura); setShowDetails(true) }}
                        >
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🌅</span>
                                <div>
                                  <p className="font-semibold text-sm">{apertura.trabajador}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{apertura.turno}</p>
                                </div>
                              </div>
                              <Badge
                                variant={apertura.completado ? "default" : "secondary"}
                                className={apertura.completado ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"}
                              >
                                {apertura.completado ? '✓ Completada' : '⏳ Pendiente'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(apertura.fechaInicio).toLocaleDateString('es-ES', {
                                weekday: 'short', day: 'numeric', month: 'short'
                              })} • {new Date(apertura.fechaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{tareasCompletadas}/{totalTareas} pasos</span>
                                <span>{progreso}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                                  style={{ width: `${progreso}%` }}
                                />
                              </div>
                            </div>
                            {apertura.completado && (
                              <p className="text-xs text-muted-foreground mt-2">
                                ⏱️ Duración: {formatDuration(apertura)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages} • {totalItems} aperturas
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline" size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Panel de detalles */}
            {showDetails && selectedApertura && (
              <div className="w-full lg:w-[400px] flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="p-4 pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌅</span>
                        <div>
                          <CardTitle className="text-base">{selectedApertura.trabajador}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">{selectedApertura.turno} • {new Date(selectedApertura.fechaInicio).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(selectedApertura.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowDetails(false); setSelectedApertura(null) }}>
                          ✕
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Inicio</p>
                        <p className="font-medium">{new Date(selectedApertura.fechaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Fin</p>
                        <p className="font-medium">{selectedApertura.fechaFin ? new Date(selectedApertura.fechaFin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Duración</p>
                        <p className="font-medium">{formatDuration(selectedApertura)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Estado</p>
                        <p className={`font-medium text-xs ${selectedApertura.completado ? 'text-green-600' : 'text-orange-600'}`}>
                          {selectedApertura.completado ? '✓ Completada' : '⏳ Pendiente'}
                        </p>
                      </div>
                    </div>

                    {/* Progreso */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Progreso</span>
                        <span className="text-muted-foreground">
                          {selectedApertura.tareas?.filter(t => t.completada).length}/{selectedApertura.tareas?.length} pasos
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          style={{ width: `${selectedApertura.tareas?.length ? Math.round((selectedApertura.tareas.filter(t => t.completada).length / selectedApertura.tareas.length) * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Lista de tareas */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Checklist de pasos</p>
                      <div className="space-y-1.5">
                        {selectedApertura.tareas?.map((tarea, i) => (
                          <div
                            key={tarea.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg text-sm border ${tarea.completada ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}
                          >
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5 ${tarea.completada ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {tarea.completada ? '✓' : i + 1}
                            </div>
                            <span className={`flex-1 ${tarea.completada ? 'text-green-800' : 'text-gray-600'}`}>
                              {tarea.nombre}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
