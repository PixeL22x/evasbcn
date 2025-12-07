'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Plus, Minus, Edit, Trash2, Search, TrendingUp, AlertCircle } from 'lucide-react'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import AdminLayout from '../../../components/AdminLayout'

export default function StockPage() {
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: '',
    stock: 0,
    stockMinimo: 5
  })

  const [productoEditando, setProductoEditando] = useState({
    id: '',
    nombre: '',
    categoria: '',
    stockMinimo: 5
  })

  const [movimiento, setMovimiento] = useState({
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchProductos()
    fetchMovimientos()
  }, [])

  const fetchProductos = async () => {
    try {
      const response = await fetch('/api/stock')
      const data = await response.json()
      setProductos(data)
    } catch (error) {
      console.error('Error fetching productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMovimientos = async () => {
    try {
      const response = await fetch('/api/stock/movimientos?limit=20')
      const data = await response.json()
      setMovimientos(data)
    } catch (error) {
      console.error('Error fetching movimientos:', error)
    }
  }

  const handleCreateProducto = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto)
      })

      if (response.ok) {
        await fetchProductos()
        setShowForm(false)
        setNuevoProducto({
          nombre: '',
          categoria: '',
          stock: 0,
          stockMinimo: 5
        })
        alert('Producto creado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear producto')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear producto')
    }
  }

  const handleEditProducto = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/stock/${productoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: productoEditando.nombre,
          categoria: productoEditando.categoria,
          stockMinimo: productoEditando.stockMinimo
        })
      })

      if (response.ok) {
        await fetchProductos()
        setShowEditForm(false)
        setProductoEditando({
          id: '',
          nombre: '',
          categoria: '',
          stockMinimo: 5
        })
        alert('Producto actualizado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al actualizar producto')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar producto')
    }
  }

  const abrirEditarProducto = (producto) => {
    setProductoEditando({
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      stockMinimo: producto.stockMinimo
    })
    setShowEditForm(true)
  }

  const handleDeleteProducto = async (producto) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/stock/${producto.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProductos()
        alert('Producto eliminado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar producto')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar producto')
    }
  }

  const handleMovimiento = async (e) => {
    e.preventDefault()
    
    if (!productoSeleccionado || !movimiento.cantidad || !movimiento.motivo) {
      alert('Por favor completa todos los campos')
      return
    }

    try {
      const response = await fetch('/api/stock/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          tipo: movimiento.tipo,
          cantidad: parseInt(movimiento.cantidad),
          motivo: movimiento.motivo,
          observaciones: movimiento.observaciones
        })
      })

      if (response.ok) {
        await fetchProductos()
        await fetchMovimientos()
        setShowMovimiento(false)
        setProductoSeleccionado(null)
        setMovimiento({
          tipo: 'entrada',
          cantidad: '',
          motivo: '',
          observaciones: ''
        })
        alert('Movimiento registrado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al registrar movimiento')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al registrar movimiento')
    }
  }

  const getStockStatus = (producto) => {
    if (producto.stock <= 0) return { 
      color: 'destructive', 
      text: 'Sin Stock'
    }
    if (producto.stock <= producto.stockMinimo) return { 
      color: 'secondary', 
      text: 'Stock Bajo',
      className: 'bg-orange-500 text-white hover:bg-orange-600'
    }
    return { 
      color: 'default', 
      text: 'Normal'
    }
  }

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategoria || filterCategoria === 'todas' || producto.categoria === filterCategoria
    return matchesSearch && matchesCategory
  })

  const categorias = [...new Set(productos.map(p => p.categoria))]

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p>Cargando productos...</p>
        </div>
      </div>
    )
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Package className="h-8 w-8 text-primary" />
                        Control de Stocks
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Gestiona el inventario y movimientos de productos
                      </p>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </div>

                  {/* Filtros */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="Buscar productos..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Todas las categorías" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas las categorías</SelectItem>
                            {categorias.map(categoria => (
                              <SelectItem key={categoria} value={categoria}>
                                {categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de productos */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProductos.map((producto) => {
                      const status = getStockStatus(producto)
                      return (
                        <Card key={producto.id} className="relative hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold">{producto.nombre}</CardTitle>
                                <p className="text-sm text-muted-foreground capitalize">{producto.categoria}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="text-2xl font-bold">{producto.stock}</div>
                                <Badge 
                                  variant={status.color} 
                                  className={`text-xs ${status.className || ''}`}
                                >
                                  {status.text}
                                </Badge>
                                {producto.stock <= 0 && (
                                  <AlertTriangle className="h-4 w-4 text-destructive mt-1" />
                                )}
                                {producto.stock > 0 && producto.stock <= producto.stockMinimo && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-1" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="text-sm text-muted-foreground">
                                Mínimo: {producto.stockMinimo}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setProductoSeleccionado(producto)
                                    setShowMovimiento(true)
                                  }}
                                  className="flex-1"
                                >
                                  Ajustar Stock
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => abrirEditarProducto(producto)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteProducto(producto)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Modal para crear producto */}
                  {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-md">
                        <CardHeader>
                          <CardTitle>Nuevo Producto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleCreateProducto} className="space-y-4">
                            <div>
                              <Label htmlFor="nombre">Nombre</Label>
                              <Input
                                id="nombre"
                                value={nuevoProducto.nombre}
                                onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                                placeholder="Nombre del producto"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="categoria">Categoría</Label>
                              <Select
                                value={nuevoProducto.categoria}
                                onValueChange={(value) => setNuevoProducto({ ...nuevoProducto, categoria: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
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

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="stock">Stock Inicial</Label>
                                <Input
                                  id="stock"
                                  type="number"
                                  min="0"
                                  value={nuevoProducto.stock}
                                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                                <Input
                                  id="stockMinimo"
                                  type="number"
                                  min="0"
                                  value={nuevoProducto.stockMinimo}
                                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, stockMinimo: parseInt(e.target.value) || 5 })}
                                />
                              </div>
                            </div>


                            <div className="flex gap-2 pt-4">
                              <Button type="submit" className="flex-1">
                                Crear Producto
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowForm(false)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Modal para editar producto */}
                  {showEditForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-md">
                        <CardHeader>
                          <CardTitle>Editar Producto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleEditProducto} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-nombre">Nombre</Label>
                              <Input
                                id="edit-nombre"
                                value={productoEditando.nombre}
                                onChange={(e) => setProductoEditando({ ...productoEditando, nombre: e.target.value })}
                                placeholder="Nombre del producto"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-categoria">Categoría</Label>
                              <Select
                                value={productoEditando.categoria}
                                onValueChange={(value) => setProductoEditando({ ...productoEditando, categoria: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
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

                            <div>
                              <Label htmlFor="edit-stockMinimo">Stock Mínimo</Label>
                              <Input
                                id="edit-stockMinimo"
                                type="number"
                                min="0"
                                value={productoEditando.stockMinimo}
                                onChange={(e) => setProductoEditando({ ...productoEditando, stockMinimo: parseInt(e.target.value) || 5 })}
                              />
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button type="submit" className="flex-1">
                                Actualizar Producto
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowEditForm(false)
                                  setProductoEditando({
                                    id: '',
                                    nombre: '',
                                    categoria: '',
                                    stockMinimo: 5
                                  })
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Modal para movimiento de stock */}
                  {showMovimiento && productoSeleccionado && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-md">
                        <CardHeader>
                          <CardTitle>Ajustar Stock - {productoSeleccionado.nombre}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleMovimiento} className="space-y-4">
                            <div>
                              <Label htmlFor="tipo">Tipo de Movimiento</Label>
                              <Select
                                value={movimiento.tipo}
                                onValueChange={(value) => setMovimiento({ ...movimiento, tipo: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="entrada">
                                    <div className="flex items-center gap-2">
                                      <Plus className="h-4 w-4" />
                                      Entrada
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="salida">
                                    <div className="flex items-center gap-2">
                                      <Minus className="h-4 w-4" />
                                      Salida
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="cantidad">Cantidad</Label>
                              <Input
                                id="cantidad"
                                type="number"
                                min="1"
                                value={movimiento.cantidad}
                                onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })}
                                placeholder="Ingresa la cantidad"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="motivo">Motivo</Label>
                              <Select
                                value={movimiento.motivo}
                                onValueChange={(value) => setMovimiento({ ...movimiento, motivo: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="compra">Compra</SelectItem>
                                  <SelectItem value="venta">Venta</SelectItem>
                                  <SelectItem value="ajuste">Ajuste de Inventario</SelectItem>
                                  <SelectItem value="merma">Merma/Pérdida</SelectItem>
                                  <SelectItem value="transferencia">Transferencia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                              <Input
                                id="observaciones"
                                value={movimiento.observaciones}
                                onChange={(e) => setMovimiento({ ...movimiento, observaciones: e.target.value })}
                                placeholder="Notas adicionales..."
                              />
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button type="submit" className="flex-1">
                                Registrar Movimiento
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowMovimiento(false)
                                  setProductoSeleccionado(null)
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Historial de movimientos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Historial de Movimientos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {movimientos.map((mov) => (
                          <div key={mov.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                              <div className="font-medium">{mov.producto.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad} • {mov.motivo}
                                {mov.trabajador && ` • ${mov.trabajador.nombre}`}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(mov.fecha).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
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
