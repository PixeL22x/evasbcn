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
import { ClipboardList, Package, Search, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import AdminLayout from '../../../components/AdminLayout'

export default function InventarioPage() {
  const [productos, setProductos] = useState([])
  const [movimientosInventario, setMovimientosInventario] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')

  useEffect(() => {
    fetchProductos()
    fetchMovimientosInventario()
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

  const fetchMovimientosInventario = async () => {
    try {
      const response = await fetch('/api/stock/movimientos')
      const data = await response.json()
      // Filtrar solo movimientos de inventario
      const inventarios = data.filter(mov => mov.motivo === 'inventario')
      setMovimientosInventario(inventarios)
    } catch (error) {
      console.error('Error fetching movimientos inventario:', error)
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

  const categorias = [...new Set(productos.map(p => p.categoria))]

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategoria || filterCategoria === 'todas' || producto.categoria === filterCategoria
    return matchesSearch && matchesCategory
  })

  if (loading) {
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
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando inventario...</p>
                  </div>
                </div>
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminLayout>
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
                        <ClipboardList className="h-8 w-8 text-primary" />
                        Control de Inventario
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Gestiona inventarios físicos y movimientos de conteo
                      </p>
                    </div>
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

                  {/* Estadísticas de inventario */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Productos</p>
                            <p className="text-2xl font-bold">{productos.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Stock Bajo</p>
                            <p className="text-2xl font-bold text-orange-500">
                              {productos.filter(p => p.stock <= p.stockMinimo && p.stock > 0).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Sin Stock</p>
                            <p className="text-2xl font-bold text-destructive">
                              {productos.filter(p => p.stock <= 0).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

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
                                  <AlertCircle className="h-4 w-4 text-destructive mt-1" />
                                )}
                                {producto.stock > 0 && producto.stock <= producto.stockMinimo && (
                                  <AlertCircle className="h-4 w-4 text-orange-500 mt-1" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="text-sm text-muted-foreground">
                                Mínimo: {producto.stockMinimo}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Último inventario: {movimientosInventario
                                  .filter(mov => mov.productoId === producto.id)
                                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]?.fecha 
                                  ? new Date(movimientosInventario
                                      .filter(mov => mov.productoId === producto.id)
                                      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0].fecha
                                    ).toLocaleDateString()
                                  : 'Nunca'
                                }
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Historial de inventarios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Historial de Inventarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {movimientosInventario.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay inventarios registrados</p>
                          </div>
                        ) : (
                          movimientosInventario
                            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                            .map((mov) => (
                              <div key={mov.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                  <div className="font-medium">{mov.producto.nombre}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad} unidades • Inventario
                                    {mov.trabajador && ` • ${mov.trabajador.nombre}`}
                                  </div>
                                  {mov.observaciones && (
                                    <div className="text-xs text-muted-foreground">
                                      {mov.observaciones}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(mov.fecha).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                        )}
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




