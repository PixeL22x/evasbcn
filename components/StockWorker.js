'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Plus, Minus, ClipboardList } from 'lucide-react'

export default function StockWorker({ onClose, trabajadorId }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [showInventario, setShowInventario] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
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
        // Actualizar la lista de productos
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
      className: 'bg-red-500 text-white border-red-500'
    }
    if (producto.stock <= producto.stockMinimo) return { 
      color: 'destructive', 
      text: 'Stock Bajo',
      className: 'bg-orange-500 text-white border-orange-500'
    }
    return { 
      color: 'default', 
      text: 'Normal',
      className: 'bg-green-500 text-white border-green-500'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p>Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Package className="h-6 w-6" />
              Control de Stock
            </h2>
            <Button onClick={onClose} variant="outline" className="font-medium">
              Cerrar
            </Button>
          </div>

          {/* Lista de productos */}
          <div className="grid gap-4 mb-6">
            {productos.map((producto) => {
              const status = getStockStatus(producto)
              return (
                <Card key={producto.id} className="relative bg-white border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-900">{producto.nombre}</CardTitle>
                        <p className="text-sm text-gray-600 capitalize">{producto.categoria}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{producto.stock}</div>
                        <Badge className={status.className}>
                          {status.text}
                        </Badge>
                        {producto.stock <= producto.stockMinimo && (
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 font-medium">
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
                          className="font-medium"
                        >
                          Ajustar Stock
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setProductoSeleccionado(producto)
                            setShowInventario(true)
                          }}
                          className="font-medium bg-blue-600 hover:bg-blue-700 text-white"
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

          {/* Modal de movimiento */}
          {showMovimiento && productoSeleccionado && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
              <Card className="w-full max-w-md bg-white shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-gray-900 font-bold">Ajustar Stock - {productoSeleccionado.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMovimiento} className="space-y-4">
                    <div>
                      <Label htmlFor="tipo" className="font-medium text-gray-700">Tipo de Movimiento</Label>
                      <Select
                        value={movimiento.tipo}
                        onValueChange={(value) => setMovimiento({ ...movimiento, tipo: value })}
                      >
                        <SelectTrigger className="text-gray-900 bg-white border-gray-300">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          <SelectItem value="entrada" className="text-gray-900 hover:bg-gray-100">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Entrada
                            </div>
                          </SelectItem>
                          <SelectItem value="salida" className="text-gray-900 hover:bg-gray-100">
                            <div className="flex items-center gap-2">
                              <Minus className="h-4 w-4" />
                              Salida
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cantidad" className="font-medium text-gray-700">Cantidad</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="1"
                        value={movimiento.cantidad}
                        onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })}
                        placeholder="Ingresa la cantidad"
                        className="font-medium text-gray-900 bg-white border-gray-300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="motivo" className="font-medium text-gray-700">Motivo</Label>
                      <Select
                        value={movimiento.motivo}
                        onValueChange={(value) => setMovimiento({ ...movimiento, motivo: value })}
                      >
                        <SelectTrigger className="text-gray-900 bg-white border-gray-300">
                          <SelectValue placeholder="Selecciona un motivo" className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          <SelectItem value="compra" className="text-gray-900 hover:bg-gray-100">Compra</SelectItem>
                          <SelectItem value="venta" className="text-gray-900 hover:bg-gray-100">Venta</SelectItem>
                          <SelectItem value="ajuste" className="text-gray-900 hover:bg-gray-100">Ajuste de Inventario</SelectItem>
                          <SelectItem value="merma" className="text-gray-900 hover:bg-gray-100">Merma/Pérdida</SelectItem>
                          <SelectItem value="transferencia" className="text-gray-900 hover:bg-gray-100">Transferencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="observaciones" className="font-medium text-gray-700">Observaciones (opcional)</Label>
                      <Input
                        id="observaciones"
                        value={movimiento.observaciones}
                        onChange={(e) => setMovimiento({ ...movimiento, observaciones: e.target.value })}
                        placeholder="Notas adicionales..."
                        className="font-medium text-gray-900 bg-white border-gray-300"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 font-medium">
                        Registrar Movimiento
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowMovimiento(false)
                          setProductoSeleccionado(null)
                        }}
                        className="font-medium"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modal de inventario */}
          {showInventario && productoSeleccionado && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
              <Card className="w-full max-w-md bg-white shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-gray-900 font-bold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Inventario - {productoSeleccionado.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Stock actual en sistema:</strong> {productoSeleccionado.stock}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Stock mínimo:</strong> {productoSeleccionado.stockMinimo}
                    </div>
                  </div>
                  
                  <form onSubmit={handleInventario} className="space-y-4">
                    <div>
                      <Label htmlFor="stockReal" className="font-medium text-gray-700">
                        Stock Real Contado
                      </Label>
                      <Input
                        id="stockReal"
                        type="number"
                        min="0"
                        value={inventario.stockReal}
                        onChange={(e) => setInventario({ ...inventario, stockReal: e.target.value })}
                        placeholder="Ingresa la cantidad real contada"
                        className="font-medium text-gray-900 bg-white border-gray-300"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cuenta físicamente cuántos productos hay realmente
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="observaciones" className="font-medium text-gray-700">
                        Observaciones (opcional)
                      </Label>
                      <Input
                        id="observaciones"
                        value={inventario.observaciones}
                        onChange={(e) => setInventario({ ...inventario, observaciones: e.target.value })}
                        placeholder="Notas sobre el inventario..."
                        className="font-medium text-gray-900 bg-white border-gray-300"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 font-medium bg-blue-600 hover:bg-blue-700">
                        Registrar Inventario
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowInventario(false)
                          setProductoSeleccionado(null)
                          setInventario({ stockReal: '', observaciones: '' })
                        }}
                        className="font-medium"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
