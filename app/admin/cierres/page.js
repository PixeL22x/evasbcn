"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/contexts/ToastContext"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, CheckCircle, XCircle, Eye, Trash2, Calendar, Search, X, Edit, Save, Sun, Moon, ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut, User, Euro, ListTodo, Maximize2, ImageIcon, MoreVertical, TrendingUp, Zap } from "lucide-react"
import { Label } from "@/components/ui/label"

export default function CierresPage() {
  const { toast } = useToast()  // ⭐ NUEVO: Hook para notificaciones
  const [cierres, setCierres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCierre, setSelectedCierre] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [editingCierre, setEditingCierre] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    totalVentas: '',
    fechaFin: ''
  })
  const [saving, setSaving] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)

  // Forzar Cierre
  const [showForzarModal, setShowForzarModal] = useState(false)
  const [forzarCierre, setForzarCierre] = useState(null)
  const [forzarVentas, setForzarVentas] = useState('')
  const [forzarTelegram, setForzarTelegram] = useState(true)
  const [forzando, setForzando] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 9

  // Filter State
  const [searchTerm, setSearchTerm] = useState("")
  const [turnoFilter, setTurnoFilter] = useState("todos")
  const [dateRangeFilter, setDateRangeFilter] = useState("todos")
  const [trabajadorFilter, setTrabajadorFilter] = useState("todos")
  const [trabajadores, setTrabajadores] = useState([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCierres()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, turnoFilter, dateRangeFilter, trabajadorFilter, currentPage])

  // Cargar lista de trabajadores únicos al montar
  useEffect(() => {
    const fetchTrabajadores = async () => {
      try {
        const res = await fetch('/api/cierre/trabajadores')
        if (res.ok) {
          const data = await res.json()
          setTrabajadores(data.trabajadores || [])
        }
      } catch (e) {
        console.error('Error cargando trabajadores:', e)
      }
    }
    fetchTrabajadores()
  }, [])

  const fetchCierres = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        turno: turnoFilter,
        dateRange: dateRangeFilter,
        trabajador: trabajadorFilter
      })

      const response = await fetch(`/api/cierre?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCierres(data.cierres || [])
        if (data.pagination) {
          setTotalPages(data.pagination.pages)
          setTotalItems(data.pagination.total)
        }
      }
    } catch (error) {
      console.error('Error fetching cierres:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getStatusBadge = (cierre) => {
    if (cierre.completado) {
      return <Badge className="bg-evas-blue/20 text-evas-blue border-evas-blue/30 dark:bg-evas-blue/20 dark:border-evas-blue/20">Completado</Badge>
    } else {
      return <Badge className="bg-evas-pink/20 text-evas-pink border-evas-pink/30 dark:bg-evas-pink/20 dark:border-evas-pink/20">En Progreso</Badge>
    }
  }

  const getTurnoIcon = (turno) => {
    if (turno === 'mañana') {
      return <Sun className="h-5 w-5 text-evas-pink" />
    } else if (turno === 'tarde') {
      return <Moon className="h-5 w-5 text-evas-blue" />
    }
    return null
  }

  const handleDeleteCierre = async (cierreId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cierre? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch('/api/cierre', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cierreId })
      })

      if (response.ok) {
        await fetchCierres()
        toast({
          title: "Eliminado",
          description: "Cierre eliminado exitosamente",
          variant: "default"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || 'Error al eliminar el cierre',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting cierre:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el cierre",
        variant: "destructive"
      })
    }
  }

  const handleViewDetails = (cierre) => {
    setSelectedCierre(cierre)
    setShowDetails(true)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedCierre(null)
  }

  const handleEditCierre = (cierre) => {
    setEditingCierre(cierre)
    // Formatear fecha y hora para datetime-local (formato: YYYY-MM-DDTHH:mm)
    let fechaFinFormatted = ''
    if (cierre.fechaFin) {
      const fechaStr = cierre.fechaFin.toString()
      const isoMatch = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
      if (isoMatch) {
        fechaFinFormatted = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${isoMatch[4]}:${isoMatch[5]}`
      } else {
        const fecha = new Date(cierre.fechaFin)
        const year = fecha.getFullYear()
        const month = String(fecha.getMonth() + 1).padStart(2, '0')
        const day = String(fecha.getDate()).padStart(2, '0')
        const hours = String(fecha.getHours()).padStart(2, '0')
        const minutes = String(fecha.getMinutes()).padStart(2, '0')
        fechaFinFormatted = `${year}-${month}-${day}T${hours}:${minutes}`
      }
    }
    setEditFormData({
      totalVentas: cierre.totalVentas || '',
      fechaFin: fechaFinFormatted
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingCierre(null)
    setEditFormData({
      totalVentas: '',
      fechaFin: ''
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingCierre) return

    setSaving(true)
    try {
      const updateData = {}

      if (editFormData.totalVentas !== '') {
        updateData.totalVentas = parseFloat(editFormData.totalVentas)
      }

      if (editFormData.fechaFin !== '') {
        const fechaLocal = new Date(editFormData.fechaFin)
        updateData.fechaFin = fechaLocal.toISOString()
      }

      const response = await fetch(`/api/cierre/${editingCierre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        await fetchCierres()
        closeEditModal()
        toast({
          title: "Actualizado",
          description: "Cierre actualizado exitosamente",
          variant: "default"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || 'Error al actualizar el cierre',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating cierre:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el cierre",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTurnoFilter("todos")
    setDateRangeFilter("todos")
    setTrabajadorFilter("todos")
    setCurrentPage(1)
  }

  const handleForzarCierre = (cierre) => {
    setForzarCierre(cierre)
    setForzarVentas(cierre.totalVentas ?? '')
    setForzarTelegram(true)
    setShowForzarModal(true)
  }

  const handleConfirmForzar = async () => {
    if (!forzarCierre) return
    setForzando(true)
    try {
      const res = await fetch(`/api/cierre/${forzarCierre.id}/forzar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalVentas: forzarVentas !== '' ? parseFloat(forzarVentas) : undefined,
          enviarTelegram: forzarTelegram
        })
      })
      const data = await res.json()
      if (res.ok) {
        await fetchCierres()
        setShowForzarModal(false)
        toast({
          title: '⚡ Cierre forzado',
          description: `Cierre de ${forzarCierre.trabajador} completado${data.telegramSent ? ' · Telegram enviado ✓' : ''}`,
          variant: 'default'
        })
      } else {
        toast({ title: 'Error', description: data.error || 'Error al forzar cierre', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setForzando(false)
    }
  }

  const hasActiveFilters = searchTerm.trim() || turnoFilter !== "todos" || dateRangeFilter !== "todos" || trabajadorFilter !== "todos"


  const getProgressPercentage = (tareas) => {
    if (!tareas || tareas.length === 0) return 0
    const completadas = tareas.filter(t => t.completada).length
    return Math.round((completadas / tareas.length) * 100)
  }

  // Devuelve null si no hay bloque granizadora, o { completada: bool } si existe
  const getGranizadoraStatus = (tareas) => {
    if (!tareas) return null
    const tarea = tareas.find(t => t.nombre && t.nombre.includes('Bloque 5.4'))
    if (!tarea) return null
    return { completada: tarea.completada }
  }

  const getTopSellingProduct = (ticketData) => {
    if (!ticketData?.items || !Array.isArray(ticketData.items) || ticketData.items.length === 0) {
      return null
    }

    // Agrupar por nombre y sumar cantidades
    const productMap = {}
    ticketData.items.forEach(item => {
      const nombre = item.nombre || item.name
      const cantidad = item.cantidad || item.quantity || 1

      if (nombre) {
        productMap[nombre] = (productMap[nombre] || 0) + cantidad
      }
    })

    // Encontrar el producto con mayor cantidad
    let topProduct = null
    let maxQuantity = 0

    Object.entries(productMap).forEach(([nombre, cantidad]) => {
      if (cantidad > maxQuantity) {
        maxQuantity = cantidad
        topProduct = { nombre, cantidad }
      }
    })

    return topProduct
  }


  const getFotosFromTareas = (tareas) => {
    if (!tareas) return []

    const fotos = []

    tareas.forEach((tarea) => {
      // 1) Preferir fotos subidas a Cloudinary (con URL)
      if (tarea.fotosSubidas) {
        let fotosSubidasArray = []
        try {
          if (typeof tarea.fotosSubidas === 'string') {
            fotosSubidasArray = JSON.parse(tarea.fotosSubidas)
          } else if (Array.isArray(tarea.fotosSubidas)) {
            fotosSubidasArray = tarea.fotosSubidas
          }
        } catch (error) {
          console.error('Error parsing fotosSubidas:', error)
          fotosSubidasArray = []
        }

        fotosSubidasArray.forEach((foto) => {
          fotos.push({
            ...foto,
            tareaNombre: tarea.nombre,
            tareaId: tarea.id,
          })
        })
        return
      }

      // 2) Fallback: si aún no hay fotos subidas, mostrar requeridas (sin URL)
      if (tarea.requiereFotos && tarea.fotosRequeridas) {
        let fotosRequeridasArray = []
        try {
          if (typeof tarea.fotosRequeridas === 'string') {
            fotosRequeridasArray = JSON.parse(tarea.fotosRequeridas)
          } else if (Array.isArray(tarea.fotosRequeridas)) {
            fotosRequeridasArray = tarea.fotosRequeridas
          }
        } catch (error) {
          console.error('Error parsing fotosRequeridas:', error)
          fotosRequeridasArray = []
        }

        fotosRequeridasArray.forEach((foto) => {
          fotos.push({
            ...foto,
            tareaNombre: tarea.nombre,
            tareaId: tarea.id,
          })
        })
      }
    })

    return fotos
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
            <main className="flex-1 overflow-y-auto relative">
              <div className="container mx-auto px-4 py-6 max-w-7xl relative z-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold">Gestión de Cierres</h1>
                      <p className="text-muted-foreground">
                        Administra y supervisa todos los procesos de cierre (carga progresiva)
                      </p>
                    </div>
                  </div>

                  {/* Filtros y búsqueda */}
                  <Card className="mb-6 shadow-sm border-none bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Búsqueda texto libre */}
                        <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-background dark:border-white/10"
                          />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")} 
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Filtro por trabajador */}
                        <Select value={trabajadorFilter} onValueChange={(v) => { setTrabajadorFilter(v); setCurrentPage(1) }}>
                          <SelectTrigger className="h-10 bg-background dark:border-white/10">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Trabajador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los trabajadores</SelectItem>
                            {trabajadores.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Filtro por turno */}
                        <Select value={turnoFilter} onValueChange={setTurnoFilter}>
                          <SelectTrigger className="h-10 bg-background dark:border-white/10">
                            <SelectValue placeholder="Turno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="mañana">Mañana</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Filtro por rango de fechas */}
                        <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                          <SelectTrigger className="h-10 bg-background dark:border-white/10">
                            <SelectValue placeholder="Periodo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todo</SelectItem>
                            <SelectItem value="7d">7 días</SelectItem>
                            <SelectItem value="30d">30 días</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Botón limpiar filtros */}
                        {hasActiveFilters && (
                          <Button
                            variant="destructive"
                            onClick={clearFilters}
                            className="w-full h-10"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Limpiar
                          </Button>
                        )}
                      </div>

                      {/* Contador de resultados */}
                      <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
                        <span><strong>{totalItems}</strong> cierres encontrados</span>
                        {loading && <span className="animate-pulse text-primary">Actualizando...</span>}
                      </div>
                    </CardContent>
                  </Card>

                  {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-6 w-32" />
                              </div>
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-24 mt-2" />
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-1/2" />
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <Skeleton className="h-3 w-10" />
                                  <Skeleton className="h-3 w-8" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-10" />
                                <Skeleton className="h-8 w-10" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cierres.length === 0 ? (
                          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border-2 border-dashed">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                              <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No se encontraron cierres</h3>
                            <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                              {hasActiveFilters
                                ? "No hay resultados que coincidan con los filtros seleccionados."
                                : "Aún no se ha registrado ningún cierre en el sistema."}
                            </p>
                            {hasActiveFilters && (
                              <Button
                                variant="outline"
                                onClick={clearFilters}
                              >
                                Limpiar filtros
                              </Button>
                            )}
                          </div>
                        ) : (
                          cierres.map((cierre) => {
                            const isTarde = cierre.turno === 'tarde'
                            return (
                              <Card
                                key={cierre.id}
                                className="group hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden border bg-card border-border hover:border-foreground/20"
                                onClick={() => handleViewDetails(cierre)}
                              >
                                {/* Actions Menu - Absolute positioned to not trigger card click */}
                                <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => handleViewDetails(cierre)}>
                                        <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditCierre(cierre)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                      </DropdownMenuItem>
                                      {!cierre.completado && (
                                        <DropdownMenuItem
                                          onClick={() => handleForzarCierre(cierre)}
                                          className="text-amber-600 focus:text-amber-600 dark:text-amber-400"
                                        >
                                          <Zap className="mr-2 h-4 w-4" /> Forzar Cierre
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteCierre(cierre.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <CardHeader className="pb-2 pr-10"> {/* Padding right for menu */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {getTurnoIcon(cierre.turno)}
                                      <CardTitle className="text-base font-semibold truncate leading-tight">{cierre.trabajador}</CardTitle>
                                    </div>
                                  </div>
                                  <CardDescription className="flex items-center justify-between text-xs mt-1">
                                    <span>{formatDate(cierre.fechaInicio)}</span>
                                    {getStatusBadge(cierre)}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">

                                    {/* Stats Row */}
                                    <div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-lg">
                                      <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Euro className="h-4 w-4" />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-foreground leading-tight">
                                            {cierre.totalVentas ? formatCurrency(cierre.totalVentas) : '-'} <span className="text-[10px] text-muted-foreground">Caja</span>
                                          </span>
                                          {cierre.totalTpv > 0 && (
                                            <span className="font-medium text-violet-500 leading-tight text-xs">
                                              +{formatCurrency(cierre.totalTpv)} <span className="text-[10px]">Tablet</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="h-4 w-px bg-border" />
                                      <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {cierre.fechaFin ?
                                            formatDate(cierre.fechaFin).split(' ')[1] :
                                            'En curso'}
                                        </span>
                                      </div>
                                    </div>


                                    {cierre.tareas && cierre.tareas.length > 0 && (
                                      <div className="space-y-1.5 pt-2">
                                        <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
                                          <span>TAREAS</span>
                                          <span>{getProgressPercentage(cierre.tareas)}%</span>
                                        </div>
                                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${cierre.completado ? 'bg-foreground' : 'bg-evas-pink'
                                              }`}
                                            style={{ width: `${getProgressPercentage(cierre.tareas)}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Explicit CTA 'Ver más' - Compact */}
                                    <div className="pt-2 flex justify-center">
                                      <div className={`
                                      flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-full transition-colors duration-200
                                      ${cierre.completado
                                          ? 'bg-muted/50 text-foreground hover:bg-muted'
                                          : 'bg-evas-pink/10 text-evas-pink hover:bg-evas-pink/20'
                                        }
                                    `}>
                                        <Eye className="h-3 w-3" />
                                        <span>Ver más</span>
                                      </div>
                                    </div>

                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {totalItems > 0 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || loading}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages || loading}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Modal de detalles del cierre */}
                  {showDetails && selectedCierre && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                      <Card className="w-full max-w-3xl max-h-[85dvh] overflow-y-auto shadow-2xl border-0 ring-1 ring-white/10 relative">
                        {/* Brand Corner Gradient */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${selectedCierre.completado ? 'from-evas-blue/20' : 'from-evas-pink/20'
                          } to-transparent -z-10 rounded-bl-full pointer-events-none`}></div>
                        <CardHeader className="border-b bg-muted/30 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                  {selectedCierre.trabajador}
                                  {selectedCierre.turno && getTurnoIcon(selectedCierre.turno)}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(selectedCierre.fechaInicio)}
                                </CardDescription>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closeDetails} className="rounded-full hover:bg-muted">
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                          {/* Stats Grid */}
                          <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${
                            (selectedCierre.turno === 'tarde' || selectedCierre.turno === 'noche') && getGranizadoraStatus(selectedCierre.tareas)
                              ? 'sm:grid-cols-4'
                              : 'sm:grid-cols-3'
                          }`}>
                            <div className="bg-muted/40 p-4 rounded-xl border flex flex-col items-center text-center hover:bg-muted/60 transition-colors">
                              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Estado
                              </div>
                              {getStatusBadge(selectedCierre)}
                            </div>

                            <div className="bg-muted/40 p-4 rounded-xl border flex flex-col items-center text-center hover:bg-muted/60 transition-colors">
                              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Euro className="h-3 w-3" /> Ventas
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="text-2xl font-bold tracking-tight">
                                  {selectedCierre.totalVentas ? formatCurrency(selectedCierre.totalVentas) : (
                                    <span className="text-muted-foreground text-lg">-</span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground font-normal ml-1">Caja</span>
                                </div>
                                {selectedCierre.totalTpv > 0 && (
                                  <div className="text-sm font-bold text-violet-500 mt-1">
                                    +{formatCurrency(selectedCierre.totalTpv)} <span className="text-[10px] font-normal">Tablet</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-muted/40 p-4 rounded-xl border flex flex-col items-center text-center hover:bg-muted/60 transition-colors">
                              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Finalizado
                              </div>
                              <div className="font-semibold">
                                {selectedCierre.fechaFin ? (
                                  formatDate(selectedCierre.fechaFin).split(' ')[1] // Only showing time
                                ) : (
                                  <span className="text-muted-foreground text-sm">En curso</span>
                                )}
                              </div>
                            </div>

                            {/* Stat: Granizadora (solo turno tarde/noche) */}
                            {(selectedCierre.turno === 'tarde' || selectedCierre.turno === 'noche') && (() => {
                              const g = getGranizadoraStatus(selectedCierre.tareas)
                              if (!g) return null
                              return (
                                <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-colors ${
                                  g.completada
                                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                                    : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                                }`}>
                                  <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span>🧊</span> Granizadora
                                  </div>
                                  <div className={`text-sm font-bold flex items-center gap-1.5 ${
                                    g.completada ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                  }`}>
                                    <span>{g.completada ? '✅' : '⚠️'}</span>
                                    <span>{g.completada ? 'Apagada' : 'Sin confirmar'}</span>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>

                          {/* Progress Section / Top Product (Tarde only) */}
                          {selectedCierre.turno === 'tarde' ? (
                            // Mostrar producto más vendido para turno tarde
                            (() => {
                              const topProduct = getTopSellingProduct(selectedCierre.ticketData)

                              return topProduct ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-primary" />
                                      Producto Más Vendido
                                    </h4>
                                  </div>
                                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                          <span className="text-2xl">🏆</span>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-foreground">{topProduct.nombre}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {topProduct.cantidad} {topProduct.cantidad === 1 ? 'unidad' : 'unidades'} vendidas
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                  <p className="text-sm text-muted-foreground">
                                    No hay datos de productos disponibles
                                  </p>
                                </div>
                              )
                            })()
                          ) : (
                            // Mantener progreso de tareas para turno mañana
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <ListTodo className="h-4 w-4 text-primary" />
                                  Progreso de Tareas
                                </h4>
                                <span className="text-sm font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                  {selectedCierre.tareas?.filter(t => t.completada).length || 0}/{selectedCierre.tareas?.length || 0}
                                </span>
                              </div>

                              <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${getProgressPercentage(selectedCierre.tareas)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground text-right">
                                {getProgressPercentage(selectedCierre.tareas)}% completado
                              </p>
                            </div>
                          )}

                          {/* Photos Section */}
                          {(() => {
                            const fotos = getFotosFromTareas(selectedCierre.tareas)
                            return fotos.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 border-t pt-6">
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                  Evidencia Fotográfica
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {fotos.map((foto, index) => (
                                    <div
                                      key={`${foto.tareaId}-${index}`}
                                      className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border bg-muted shadow-sm transition-all hover:shadow-md"
                                      onClick={() => setLightboxImage(foto)}
                                    >
                                      {foto.url ? (
                                        <>
                                          <img
                                            src={foto.url}
                                            alt={`Foto ${index + 1}`}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                          />
                                          {/* Hover Overlay */}
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                            <Maximize2 className="text-white h-8 w-8 drop-shadow-md transform scale-90 group-hover:scale-100 transition-transform" />
                                          </div>

                                          {/* Badges */}
                                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full opacity-100 transition-opacity">
                                            {index + 1}
                                          </div>
                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                            <p className="text-white text-xs font-medium truncate">
                                              {foto.tipo}
                                            </p>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                                          <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                                          <span className="text-xs">Sin imagen</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Lightbox Modal */}
                  {/* Lightbox Modal */}
                  {/* Lightbox Modal */}
                  {/* Lightbox Modal */}
                  {lightboxImage && (
                    <div
                      className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[60] p-0 sm:p-4 animate-in fade-in duration-200 show"
                      onClick={() => {
                        setLightboxImage(null)
                        setRotation(0)
                        setZoom(1)
                      }}
                    >
                      {/* Navigation Logic */}
                      {(() => {
                        const fotos = getFotosFromTareas(selectedCierre?.tareas)
                        const currentIndex = fotos.findIndex(f => f.url === lightboxImage.url)
                        const hasNext = currentIndex < fotos.length - 1
                        const hasPrev = currentIndex > 0

                        const handleNext = (e) => {
                          e.stopPropagation()
                          if (hasNext) {
                            setLightboxImage(fotos[currentIndex + 1])
                            setRotation(0)
                            setZoom(1)
                          }
                        }

                        const handlePrev = (e) => {
                          e.stopPropagation()
                          if (hasPrev) {
                            setLightboxImage(fotos[currentIndex - 1])
                            setRotation(0)
                            setZoom(1)
                          }
                        }

                        const handleRotate = (e) => {
                          e.stopPropagation()
                          setRotation(prev => (prev + 90) % 360)
                        }

                        const handleZoomIn = (e) => {
                          e.stopPropagation()
                          setZoom(prev => Math.min(prev + 0.5, 3))
                        }

                        const handleZoomOut = (e) => {
                          e.stopPropagation()
                          setZoom(prev => Math.max(prev - 0.5, 0.5))
                        }

                        return (
                          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-8 overflow-hidden">
                            <img
                              src={lightboxImage.url}
                              alt="Foto ampliada"
                              className="max-w-full max-h-[75dvh] sm:max-h-[85dvh] object-contain rounded-md sm:rounded-lg shadow-2xl transition-all duration-300 select-none"
                              style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
                              onClick={(e) => e.stopPropagation()}
                            />

                            {/* Floating Toolbar (Bottom Center) */}
                            <div className="absolute bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[70] animate-in slide-in-from-bottom-4 duration-300">
                              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-xl">
                                <button
                                  onClick={handleRotate}
                                  className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors group relative"
                                  title="Girar 90°"
                                >
                                  <RotateCw className="h-5 w-5 group-active:rotate-90 transition-transform duration-200" />
                                </button>

                                <div className="w-px h-4 bg-white/20 mx-1" />

                                <button
                                  onClick={handleZoomOut}
                                  className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                  disabled={zoom <= 0.5}
                                  title="Alejar"
                                >
                                  <ZoomOut className="h-5 w-5" />
                                </button>

                                <button
                                  onClick={handleZoomIn}
                                  className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                  disabled={zoom >= 3}
                                  title="Acercar"
                                >
                                  <ZoomIn className="h-5 w-5" />
                                </button>

                                {(zoom !== 1 || rotation !== 0) && (
                                  <>
                                    <div className="w-px h-4 bg-white/20 mx-1" />
                                    <button
                                      onClick={() => {
                                        setZoom(1)
                                        setRotation(0)
                                      }}
                                      className="px-3 py-1 text-xs font-medium hover:bg-white/10 rounded-full text-white transition-colors"
                                    >
                                      Reset
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Caption - Repositioned above toolbar */}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-50">
                              <div className="bg-black/40 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium text-center shadow-lg flex items-center gap-2 border border-white/5">
                                <span className="opacity-90">{lightboxImage.tipo}</span>
                                <span className="w-1 h-1 bg-white/50 rounded-full" />
                                <span className="opacity-70 text-xs"> Foto {currentIndex + 1} de {fotos.length}</span>
                              </div>
                            </div>

                            {/* Close Button - Optimized for touch */}
                            <button
                              onClick={() => {
                                setLightboxImage(null)
                                setRotation(0)
                                setZoom(1)
                              }}
                              className="absolute top-12 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors backdrop-blur-md z-50 border border-white/10"
                              aria-label="Cerrar"
                            >
                              <X className="h-5 w-5" />
                            </button>



                            {/* Navigation Arrows - Large touch targets but smaller icons on mobile */}
                            {hasPrev && (
                              <button
                                onClick={handlePrev}
                                className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white w-12 h-20 sm:w-14 sm:h-14 sm:rounded-full flex items-center justify-center transition-colors backdrop-blur-sm z-50 group active:bg-black/50"
                                aria-label="Anterior"
                              >
                                <ChevronLeft className="h-8 w-8 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform drop-shadow-md" />
                              </button>
                            )}

                            {hasNext && (
                              <button
                                onClick={handleNext}
                                className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white w-12 h-20 sm:w-14 sm:h-14 sm:rounded-full flex items-center justify-center transition-colors backdrop-blur-sm z-50 group active:bg-black/50"
                                aria-label="Siguiente"
                              >
                                <ChevronRight className="h-8 w-8 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform drop-shadow-md" />
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Modal de edición */}
                  {showEditModal && editingCierre && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-md">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Editar Cierre</CardTitle>
                            <Button variant="outline" size="sm" onClick={closeEditModal}>
                              ✕
                            </Button>
                          </div>
                          <CardDescription>
                            Editar información del cierre de {editingCierre.trabajador}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="totalVentas">Total de Ventas (€)</Label>
                              <Input
                                id="totalVentas"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editFormData.totalVentas}
                                onChange={(e) => setEditFormData({ ...editFormData, totalVentas: e.target.value })}
                                placeholder="Ej: 1250.50"
                              />
                              <p className="text-xs text-muted-foreground">
                                Dejar vacío para mantener el valor actual
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="fechaFin">Fecha y Hora de Finalización (24h)</Label>
                              <Input
                                id="fechaFin"
                                type="datetime-local"
                                value={editFormData.fechaFin}
                                onChange={(e) => setEditFormData({ ...editFormData, fechaFin: e.target.value })}
                                step="60"
                              />
                              <p className="text-xs text-muted-foreground">
                                Formato: DD/MM/YYYY HH:mm (24 horas). Dejar vacío para mantener la fecha y hora actual
                              </p>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button
                                type="submit"
                                disabled={saving}
                                className="flex-1"
                              >
                                {saving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar Cambios
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={closeEditModal}
                                disabled={saving}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {/* Modal Forzar Cierre */}
                  {showForzarModal && forzarCierre && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-md shadow-2xl border-0 ring-1 ring-amber-500/30">
                        <CardHeader className="border-b bg-amber-50/80 dark:bg-amber-900/20 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-amber-800 dark:text-amber-300">Forzar Cierre</CardTitle>
                              <CardDescription className="text-amber-600/80 dark:text-amber-400/70 text-xs mt-0.5">Completara el cierre manualmente</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                          <div className="rounded-xl bg-muted/50 border px-4 py-3 text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Trabajador</span><span className="font-semibold">{forzarCierre.trabajador}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Turno</span><span className="font-semibold capitalize">{forzarCierre.turno}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Inicio</span><span className="font-semibold">{formatDate(forzarCierre.fechaInicio)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Progreso tareas</span><span className="font-semibold">{forzarCierre.tareas?.filter(t => t.completada).length ?? 0}/{forzarCierre.tareas?.length ?? 0}</span></div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="forzar-ventas" className="text-sm">Total de ventas (euro) <span className="text-muted-foreground font-normal">opcional</span></Label>
                            <Input id="forzar-ventas" type="number" min="0" step="0.01" value={forzarVentas} onChange={e => setForzarVentas(e.target.value)} placeholder="Ej: 1250.50" />
                            <p className="text-xs text-muted-foreground">{forzarCierre.totalVentas ? `Valor actual: EUR${forzarCierre.totalVentas}` : 'Sin ventas registradas'}</p>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setForzarTelegram(!forzarTelegram)}>
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">✈️</span>
                              <div><p className="text-sm font-medium">Notificacion Telegram</p><p className="text-xs text-muted-foreground">Marcado como Cierre Forzado</p></div>
                            </div>
                            <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all ${forzarTelegram ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${forzarTelegram ? 'translate-x-5' : ''}`} />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button onClick={handleConfirmForzar} disabled={forzando} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                              {forzando ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Forzando...</> : <><Zap className="h-4 w-4 mr-2" />Forzar Cierre</>}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForzarModal(false)} disabled={forzando}>Cancelar</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider >
    </AdminLayout >
  )
}
