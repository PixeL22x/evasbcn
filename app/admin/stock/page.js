'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Archive,
  MoreHorizontal,
  History,
  ArrowUpDown,
  Filter
} from 'lucide-react'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import AdminLayout from '../../../components/AdminLayout'

export default function StockPage() {
  // Data State
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [showInactive, setShowInactive] = useState(false)

  // Modal/Sheet Controls
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState('create') // 'create', 'edit'
  const [showMovimientoSheet, setShowMovimientoSheet] = useState(false)

  // Selection State
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  // Pagination State (History)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Form States
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    stock: 0,
    stockMinimo: 5,
    precio: '',
    activo: true
  })

  const [movimientoData, setMovimientoData] = useState({
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    observaciones: ''
  })

  // Initial Data Fetch
  useEffect(() => {
    console.log('Stock Page Mounted - New Design')
    fetchProductos()
  }, [showInactive])

  useEffect(() => {
    fetchMovimientos()
  }, [currentPage])

  // --- API Handlers ---

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stock?includeInactive=${showInactive}`)
      const data = await response.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMovimientos = async () => {
    try {
      const response = await fetch(`/api/stock/movimientos?page=${currentPage}&limit=${ITEMS_PER_PAGE}`)
      const data = await response.json()
      if (data.data) {
        setMovimientos(data.data)
        setTotalPages(data.pagination.pages)
      } else {
        setMovimientos([])
      }
    } catch (error) {
      console.error('Error fetching movimientos:', error)
      setMovimientos([])
    }
  }

  const handleSubmitProducto = async (e) => {
    e.preventDefault()
    const isEdit = sheetMode === 'edit'
    const endpoint = isEdit ? `/api/stock/${productoSeleccionado.id}` : '/api/stock'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchProductos()
        setIsSheetOpen(false)
        resetForms()
        // alert(`Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`)
      } else {
        const error = await response.json()
        alert(error.error || 'Error en la operación')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error en la operación')
    }
  }

  const handleDeleteProducto = async (producto) => {
    if (!confirm(`¿Estás seguro de que quieres archivar "${producto.nombre}"?`)) return

    try {
      const response = await fetch(`/api/stock/${producto.id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchProductos()
      } else {
        alert('Error al eliminar producto')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleRestoreProducto = async (producto) => {
    try {
      const response = await fetch(`/api/stock/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...producto, activo: true })
      })
      if (response.ok) {
        await fetchProductos()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleMovimientoSubmit = async (e) => {
    e.preventDefault()
    if (!productoSeleccionado) return

    try {
      const response = await fetch('/api/stock/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          tipo: movimientoData.tipo,
          cantidad: parseInt(movimientoData.cantidad),
          motivo: movimientoData.motivo,
          observaciones: movimientoData.observaciones
        })
      })

      if (response.ok) {
        await fetchProductos()
        await fetchMovimientos()
        setShowMovimientoSheet(false)
        resetForms()
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // --- Helpers ---

  const resetForms = () => {
    setFormData({ nombre: '', categoria: '', stock: 0, stockMinimo: 5, precio: '', activo: true })
    setMovimientoData({ tipo: 'entrada', cantidad: '', motivo: '', observaciones: '' })
    setProductoSeleccionado(null)
  }

  const openEdit = (producto) => {
    setProductoSeleccionado(producto)
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      stock: producto.stock, // Stock is read-only in edit usually, but keeping structure
      stockMinimo: producto.stockMinimo,
      precio: producto.precio || '',
      activo: producto.activo
    })
    setSheetMode('edit')
    setIsSheetOpen(true)
  }

  const openAdjust = (producto) => {
    setProductoSeleccionado(producto)
    setShowMovimientoSheet(true)
  }

  const getStockStatus = (producto) => {
    if (!producto.activo) return { label: 'Archivado', color: 'secondary', className: 'bg-zinc-100 text-zinc-500' }
    if (producto.stock <= 0) return { label: 'Sin Stock', color: 'destructive', className: '' }
    if (producto.stock <= producto.stockMinimo) return { label: 'Bajo Stock', color: 'warning', className: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' }
    return { label: 'Normal', color: 'success', className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' }
  }

  // --- Computed Data ---

  const filteredProductos = useMemo(() => {
    return productos.filter(producto => {
      const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !filterCategoria || filterCategoria === 'todas' || producto.categoria === filterCategoria
      return matchesSearch && matchesCategory
    })
  }, [productos, searchTerm, filterCategoria])

  const kpiData = useMemo(() => {
    const activeProducts = productos.filter(p => p.activo)
    return {
      total: activeProducts.length,
      lowStock: activeProducts.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length,
      outStock: activeProducts.filter(p => p.stock <= 0).length,
      archived: productos.filter(p => !p.activo).length
    }
  }, [productos])

  const categorias = useMemo(() => [...new Set(productos.map(p => p.categoria))], [productos])

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
          <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Gestión de Inventario
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                      Administra productos, existencias y audita movimientos.
                    </p>
                  </div>
                  <Button
                    onClick={() => { resetForms(); setSheetMode('create'); setIsSheetOpen(true) }}
                    className="shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpiData.total}</div>
                      <p className="text-xs text-muted-foreground">Productos activos en catálogo</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{kpiData.lowStock}</div>
                      <p className="text-xs text-muted-foreground">Requieren reabastecimiento</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">{kpiData.outStock}</div>
                      <p className="text-xs text-muted-foreground">Productos agotados</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-100/50 dark:bg-zinc-800/50 border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Archivados</CardTitle>
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-zinc-500">{kpiData.archived}</div>
                      <p className="text-xs text-muted-foreground">Histórico eliminado</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="inventory" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="inventory" className="gap-2">
                      <Package className="h-4 w-4" />
                      Inventario
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" />
                      Historial Movimientos
                    </TabsTrigger>
                  </TabsList>

                  {/* INVENTORY TAB */}
                  <TabsContent value="inventory" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                          <CardTitle>Listado de Productos</CardTitle>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* Toolbar */}
                            <div className="relative w-full sm:w-64">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por nombre..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                              <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todas">Todas</SelectItem>
                                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center space-x-2 px-2 border rounded-md">
                              <Switch id="archive-mode" checked={showInactive} onCheckedChange={setShowInactive} />
                              <Label htmlFor="archive-mode" className="text-xs whitespace-nowrap">Ver Archivados</Label>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">Estado</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                                <TableHead className="text-right">Stock Actual</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Mínimo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProductos.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="h-24 text-center">
                                    No se encontraron productos.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredProductos.map((producto) => {
                                  const status = getStockStatus(producto)
                                  return (
                                    <TableRow key={producto.id} className="group even:bg-muted/50 hover:bg-muted/70">
                                      <TableCell className="p-2 sm:p-4">
                                        <Badge variant="outline" className={`font-medium ${status.className}`}>
                                          <span className="sm:hidden w-2 h-2 rounded-full bg-current block" />
                                          <span className="hidden sm:inline">{status.label}</span>
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="font-medium p-2 sm:p-4">
                                        <div className="flex flex-col">
                                          <span className="text-base sm:text-sm font-semibold sm:font-normal">{producto.nombre}</span>
                                          <span className="text-xs text-muted-foreground sm:hidden capitalize">{producto.categoria}</span>
                                          {!producto.activo && <span className="text-xs text-muted-foreground flex items-center gap-1"><Archive className="h-3 w-3" /> Archivado</span>}
                                        </div>
                                      </TableCell>
                                      <TableCell className="capitalize text-muted-foreground hidden md:table-cell">{producto.categoria}</TableCell>
                                      <TableCell className="text-right font-mono font-bold text-lg sm:text-base p-2 sm:p-4">
                                        {producto.stock}
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                                        {producto.stockMinimo}
                                      </TableCell>
                                      <TableCell className="p-2 sm:p-4">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Abrir menú</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            {producto.activo ? (
                                              <>
                                                <DropdownMenuItem onClick={() => openAdjust(producto)}>
                                                  <ArrowUpDown className="mr-2 h-4 w-4" /> Ajustar Stock
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEdit(producto)}>
                                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteProducto(producto)} className="text-destructive focus:text-destructive">
                                                  <Trash2 className="mr-2 h-4 w-4" /> Archivar
                                                </DropdownMenuItem>
                                              </>
                                            ) : (
                                              <DropdownMenuItem onClick={() => handleRestoreProducto(producto)} className="text-emerald-600 focus:text-emerald-600">
                                                <RefreshCw className="mr-2 h-4 w-4" /> Restaurar
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* HISTORY TAB */}
                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle>Historial Global</CardTitle>
                        <CardDescription>
                          Registro completo de entradas y salidas de inventario.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead className="hidden md:table-cell">Motivo</TableHead>
                                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {movimientos.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="h-24 text-center">No hay registros.</TableCell>
                                </TableRow>
                              ) : (
                                movimientos.map((mov) => (
                                  <TableRow key={mov.id} className="even:bg-muted/50 hover:bg-muted/70">
                                    <TableCell className="text-muted-foreground text-sm p-3">
                                      <div className="flex flex-col">
                                        <span>{new Date(mov.fecha).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                                        <span className="text-xs opacity-50">{new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium p-3">
                                      <div className="flex flex-col">
                                        <span>{mov.producto?.nombre || 'Deleted'}</span>
                                        <span className="text-xs text-muted-foreground md:hidden capitalize">{mov.motivo} - {mov.trabajador?.nombre?.split(' ')[0]}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="p-3">
                                      <Badge variant={mov.tipo === 'entrada' ? 'success' : 'secondary'} className={mov.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                                        {mov.tipo === 'entrada' ? 'IN' : 'OUT'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className={`font-mono font-bold text-right p-3 ${mov.tipo === 'entrada' ? 'text-emerald-600' : 'text-zinc-500'}`}>
                                      {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                                    </TableCell>
                                    <TableCell className="capitalize hidden md:table-cell">{mov.motivo}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                                      {mov.trabajador?.nombre || 'Sistema'}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              Anterior
                            </Button>
                            <div className="text-sm font-medium">
                              Página {currentPage} de {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Siguiente
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* SHEET - CREATE / EDIT PRODUCT */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{sheetMode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}</SheetTitle>
            <SheetDescription>
              {sheetMode === 'create' ? 'Añade un nuevo ítem al inventario global.' : 'Modifica los detalles del producto.'}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmitProducto} className="space-y-6 pt-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del Producto</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Tarrina Mediana"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="helados">Helados</SelectItem>
                      <SelectItem value="churros">Churros</SelectItem>
                      <SelectItem value="toppings">Toppings</SelectItem>
                      <SelectItem value="conos">Conos</SelectItem>
                      <SelectItem value="bebidas">Bebidas</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stockMinimo">Stock Mínimo (Alerta)</Label>
                  <Input
                    id="stockMinimo"
                    type="number"
                    min="0"
                    value={formData.stockMinimo}
                    onChange={e => setFormData({ ...formData, stockMinimo: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {sheetMode === 'create' && (
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Define la cantidad actual disponible al crear el producto.
                  </p>
                </div>
              )}

              {sheetMode === 'edit' && !formData.activo && (
                <div className="flex items-center space-x-2 rounded-md border p-3 bg-muted/50">
                  <Switch
                    id="activate"
                    checked={formData.activo}
                    onCheckedChange={c => setFormData({ ...formData, activo: c })}
                  />
                  <Label htmlFor="activate" className="flex-1 cursor-pointer">Reactivar Producto</Label>
                </div>
              )}
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </SheetClose>
              <Button type="submit">{sheetMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* SHEET - MOVEMENT */}
      <Sheet open={showMovimientoSheet} onOpenChange={setShowMovimientoSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Ajuste de Stock</SheetTitle>
            <SheetDescription>
              Registrando movimiento para <span className="font-semibold text-foreground">{productoSeleccionado?.nombre}</span>
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleMovimientoSubmit} className="space-y-6 pt-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Ajuste</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={movimientoData.tipo === 'entrada' ? 'default' : 'outline'}
                    onClick={() => setMovimientoData({ ...movimientoData, tipo: 'entrada' })}
                    className={movimientoData.tipo === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Entrada
                  </Button>
                  <Button
                    type="button"
                    variant={movimientoData.tipo === 'salida' ? 'default' : 'outline'}
                    onClick={() => setMovimientoData({ ...movimientoData, tipo: 'salida' })}
                    className={movimientoData.tipo === 'salida' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                  >
                    <Minus className="mr-2 h-4 w-4" /> Salida
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mov-cantidad">Cantidad</Label>
                <Input
                  id="mov-cantidad"
                  type="number"
                  min="1"
                  autoFocus
                  required
                  value={movimientoData.cantidad}
                  onChange={e => setMovimientoData({ ...movimientoData, cantidad: e.target.value })}
                  className="text-lg font-bold"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mov-motivo">Motivo</Label>
                <Select value={movimientoData.motivo} onValueChange={v => setMovimientoData({ ...movimientoData, motivo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra">Compra / Reposición</SelectItem>
                    <SelectItem value="venta">Venta</SelectItem>
                    <SelectItem value="merma">Merma / Caducado</SelectItem>
                    <SelectItem value="ajuste">Corrección Inventario</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mov-obs">Observaciones (Opcional)</Label>
                <Input
                  id="mov-obs"
                  value={movimientoData.observaciones}
                  onChange={e => setMovimientoData({ ...movimientoData, observaciones: e.target.value })}
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>

            <SheetFooter>
              <Button type="submit" className="w-full">Registrar Movimiento</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

    </AdminLayout>
  )
}
