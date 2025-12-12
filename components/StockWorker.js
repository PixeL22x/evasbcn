'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Plus, Minus, ClipboardList, Search, History, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function StockWorker({ onClose, trabajadorId }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [showInventario, setShowInventario] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [movimiento, setMovimiento] = useState({
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    observaciones: ''
  })

  const [inventario, setInventario] = useState({
    stockReal: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchProductos()
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

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria).filter(Boolean))
    return ['all', ...Array.from(cats).sort()]
  }, [productos])

  // Filter products
  const filteredProductos = useMemo(() => {
    return productos.filter(producto => {
      const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || producto.categoria === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [productos, searchTerm, selectedCategory])

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
          trabajadorId: trabajadorId,
          observaciones: movimiento.observaciones
        })
      })

      if (response.ok) {
        await fetchProductos()
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

  const handleInventario = async (e) => {
    e.preventDefault()

    if (!productoSeleccionado || !inventario.stockReal) {
      alert('Por favor ingresa el stock real contado')
      return
    }

    const stockReal = parseInt(inventario.stockReal)
    const stockActual = productoSeleccionado.stock
    const diferencia = stockReal - stockActual

    if (diferencia === 0) {
      alert('El stock real coincide con el stock actual. No se registra movimiento.')
      setShowInventario(false)
      setProductoSeleccionado(null)
      setInventario({ stockReal: '', observaciones: '' })
      return
    }

    try {
      const response = await fetch('/api/stock/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          tipo: diferencia > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(diferencia),
          motivo: 'inventario',
          trabajadorId: trabajadorId,
          observaciones: `Inventario: Stock real ${stockReal}, Stock actual ${stockActual}. ${inventario.observaciones}`
        })
      })

      if (response.ok) {
        await fetchProductos()
        setShowInventario(false)
        setProductoSeleccionado(null)
        setInventario({ stockReal: '', observaciones: '' })
        alert(`Inventario registrado correctamente. Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al registrar inventario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al registrar inventario')
    }
  }

  const getStockStatus = (producto) => {
    if (producto.stock <= 0) return {
      color: 'destructive',
      text: 'Sin Stock',
      className: 'bg-red-500/80 text-white border-red-500/50 hover:bg-red-600/80'
    }
    if (producto.stock <= producto.stockMinimo) return {
      color: 'destructive',
      text: 'Stock Bajo',
      className: 'bg-orange-500/80 text-white border-orange-500/50 hover:bg-orange-600/80'
    }
    return {
      color: 'default',
      text: 'Normal',
      className: 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 border border-white/20 p-6 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
          <p className="flex items-center gap-2 font-medium text-lg text-white">
            <Package className="animate-bounce" /> Cargando productos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Main Container with App Gradient - Mobile Optimized Height */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl max-w-5xl w-full h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">

        {/* Header - Compact on mobile */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-black/20 flex-shrink-0 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
              Stock
            </h2>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-white/70 hover:bg-white/10 hover:text-white rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Buscar producto..."
                className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-purple-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-full sm:w-[200px]">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white focus:ring-purple-500/50">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <SelectValue placeholder="Categoría" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="all" className="focus:bg-white/10 focus:text-white">Todas</SelectItem>
                    {categories.filter(c => c !== 'all').map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize focus:bg-white/10 focus:text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Desktop Summary Badge */}
              <div className="hidden sm:flex items-center px-4 bg-white/5 rounded-md border border-white/10 text-sm font-medium text-white/70 whitespace-nowrap">
                {filteredProductos.length} prods
              </div>
            </div>
          </div>
        </div>

        {/* Product List - Mobile Optimized scrolling */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-black/10">
          {filteredProductos.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
              {filteredProductos.map((producto) => {
                const status = getStockStatus(producto)
                return (
                  <Card key={producto.id} className="group bg-white/5 border-white/10 active:bg-white/15 transition-all duration-200">
                    <CardHeader className="pb-2 p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg text-white font-bold tracking-tight truncate pr-1">{producto.nombre}</CardTitle>
                          <CardDescription className="capitalize font-medium text-white/50 mt-0.5 text-xs sm:text-sm">
                            {producto.categoria}
                          </CardDescription>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tighter shadow-black drop-shadow-md">{producto.stock}</div>
                          <Badge className={`${status.className} mt-1 border text-[10px] sm:text-xs px-1.5 py-0.5`}>
                            {status.text}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 p-4">
                      <div className="flex justify-between items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setProductoSeleccionado(producto)
                            setShowHistory(true)
                          }}
                          className="h-10 w-10 p-0 rounded-full text-white/50 hover:text-purple-300 hover:bg-white/10"
                          title="Ver historial"
                        >
                          <History className="h-5 w-5" />
                        </Button>

                        <div className="flex gap-2 flex-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setProductoSeleccionado(producto)
                              setShowMovimiento(true)
                            }}
                            className="h-10 font-medium bg-transparent border-white/20 text-white hover:bg-white/20 active:scale-95 transition-transform"
                          >
                            Ajustar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setProductoSeleccionado(producto)
                              setShowInventario(true)
                            }}
                            className="h-10 font-medium bg-gradient-to-r from-blue-500 to-purple-600 active:from-blue-600 active:to-purple-700 text-white shadow-lg border-none active:scale-95 transition-transform"
                          >
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Inventario
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Modals - Mobile Optimized with bottom sheet feel on mobile if needed, or just centered card */}

        {/* Modal de Movimiento */}
        {showMovimiento && productoSeleccionado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 animate-in fade-in duration-200">
            <Card className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/20 text-white shadow-2xl rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                <CardTitle className="text-white font-bold flex items-center justify-between">
                  <span>Ajustar Stock</span>
                  <Badge variant="outline" className="border-white/20 text-white bg-transparent max-w-[150px] truncate">{productoSeleccionado.nombre}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <form onSubmit={handleMovimiento} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="tipo" className="font-medium text-white/80">Tipo</Label>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-11 border-white/20 ${movimiento.tipo === 'entrada' ? 'bg-green-600/80 hover:bg-green-600 text-white border-transparent' : 'bg-transparent text-white hover:bg-white/10'}`}
                          onClick={() => setMovimiento({ ...movimiento, tipo: 'entrada' })}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Entrada
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-11 border-white/20 ${movimiento.tipo === 'salida' ? 'bg-red-600/80 hover:bg-red-600 text-white border-transparent' : 'bg-transparent text-white hover:bg-white/10'}`}
                          onClick={() => setMovimiento({ ...movimiento, tipo: 'salida' })}
                        >
                          <Minus className="h-4 w-4 mr-2" /> Salida
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cantidad" className="font-medium text-white/80">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      value={movimiento.cantidad}
                      onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })}
                      placeholder="0"
                      className="font-medium text-white bg-white/5 border-white/20 text-lg h-12 focus:border-purple-500/50"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivo" className="font-medium text-white/80">Motivo</Label>
                    <Select
                      value={movimiento.motivo}
                      onValueChange={(value) => setMovimiento({ ...movimiento, motivo: value })}
                    >
                      <SelectTrigger className="h-12 text-white bg-white/5 border-white/20">
                        <SelectValue placeholder="Selecciona un motivo" className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="compra">Compra / Reposición</SelectItem>
                        <SelectItem value="venta">Venta Manual</SelectItem>
                        <SelectItem value="merma">Merma / Caducado / Roto</SelectItem>
                        <SelectItem value="ajuste">Ajuste de Inventario</SelectItem>
                        <SelectItem value="consumo">Consumo Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="observaciones" className="font-medium text-white/80">Observaciones</Label>
                    <Input
                      id="observaciones"
                      value={movimiento.observaciones}
                      onChange={(e) => setMovimiento({ ...movimiento, observaciones: e.target.value })}
                      placeholder="Ej: Se rompió..."
                      className="font-medium text-white bg-white/5 border-white/20 h-12"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 pb-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowMovimiento(false)
                        setProductoSeleccionado(null)
                      }}
                      className="flex-1 font-medium h-12 bg-transparent text-white border-white/20 hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-[2] font-medium text-lg h-12 bg-white text-purple-900 hover:bg-white/90">
                      Confirmar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Inventario */}
        {showInventario && productoSeleccionado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 animate-in fade-in duration-200">
            <Card className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/20 text-white shadow-2xl rounded-t-xl sm:rounded-xl">
              <CardHeader className="border-b border-white/10 bg-white/5 rounded-t-lg">
                <CardTitle className="text-white font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-purple-400" />
                    <span>Inventario</span>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white bg-transparent max-w-[150px] truncate">{productoSeleccionado.nombre}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg flex justify-between items-center text-purple-200">
                  <div className="text-sm font-medium">Stock Sistema:</div>
                  <div className="text-2xl font-bold text-white">{productoSeleccionado.stock}</div>
                </div>

                <form onSubmit={handleInventario} className="space-y-6">
                  <div>
                    <Label htmlFor="stockReal" className="font-medium text-white/80">
                      ¿Cantidad FÍSICA?
                    </Label>
                    <Input
                      id="stockReal"
                      type="number"
                      min="0"
                      value={inventario.stockReal}
                      onChange={(e) => setInventario({ ...inventario, stockReal: e.target.value })}
                      placeholder="0"
                      className="font-medium text-white bg-white/5 border-white/20 text-4xl text-center h-20 mt-2 focus:border-purple-500/50 rounded-xl"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="observaciones" className="font-medium text-white/80">Observaciones</Label>
                    <Input
                      id="observaciones"
                      value={inventario.observaciones}
                      onChange={(e) => setInventario({ ...inventario, observaciones: e.target.value })}
                      placeholder="Notas..."
                      className="font-medium text-white bg-white/5 border-white/20 h-12"
                    />
                  </div>

                  <div className="flex gap-3 pt-2 pb-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowInventario(false)
                        setProductoSeleccionado(null)
                        setInventario({ stockReal: '', observaciones: '' })
                      }}
                      className="flex-1 font-medium h-14 bg-transparent text-white border-white/20 hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-[2] font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg h-14 border-none shadow-lg">
                      Guardar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Historial */}
        {showHistory && productoSeleccionado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 animate-in fade-in duration-200">
            <Card className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/20 text-white shadow-2xl rounded-t-xl sm:rounded-xl">
              <CardHeader className="border-b border-white/10 bg-white/5 rounded-t-lg">
                <CardTitle className="text-white font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-400" />
                    <span>Historial</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowHistory(false)
                      setProductoSeleccionado(null)
                    }}
                    className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/10 max-h-[50vh] overflow-y-auto">
                  {productoSeleccionado.movimientos && productoSeleccionado.movimientos.length > 0 ? (
                    productoSeleccionado.movimientos.map((mov) => (
                      <div key={mov.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${mov.tipo === 'entrada'
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}>
                            {mov.tipo === 'entrada' ? '+' : '-'} {mov.tipo}
                          </span>
                          <span className="text-xs text-white/40">
                            {format(new Date(mov.fecha), "dd/MM HH:mm", { locale: es })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-lg">
                            {mov.cantidad} <span className="text-sm font-normal text-white/50">u</span>
                          </span>
                          <span className="text-sm font-medium text-white/70 bg-white/10 px-2 py-0.5 rounded truncate max-w-[150px]">
                            {mov.motivo}
                          </span>
                        </div>
                        {mov.observaciones && (
                          <p className="text-sm text-white/50 italic mt-1 bg-black/20 p-2 rounded border border-white/5">
                            "{mov.observaciones}"
                          </p>
                        )}
                        <div className="mt-2 text-xs text-purple-400 font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          {mov.trabajador?.nombre || 'Sys'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-white/30 text-sm">
                      Sin movimientos recientes.
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 bg-white/5 border-t border-white/10 rounded-b-lg sm:rounded-b-lg pb-8 sm:pb-4">
                <Button
                  className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 h-12"
                  variant="outline"
                  onClick={() => {
                    setShowHistory(false)
                    setProductoSeleccionado(null)
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
