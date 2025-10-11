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
import { formatDate } from "@/lib/utils"
import { IceCream, Clock, CheckCircle, Truck, Trash2, Eye } from "lucide-react"

export default function PedidosHeladosPage() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchPedidos()
  }, [])

  const fetchPedidos = async () => {
    try {
      const response = await fetch('/api/pedidos-helados')
      if (response.ok) {
        const data = await response.json()
        setPedidos(data.pedidos || [])
      }
    } catch (error) {
      console.error('Error fetching pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pendiente</Badge>
      case 'procesado':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Procesado</Badge>
      case 'entregado':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Entregado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{estado}</Badge>
    }
  }

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="h-4 w-4" />
      case 'procesado':
        return <CheckCircle className="h-4 w-4" />
      case 'entregado':
        return <Truck className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleStatusChange = async (pedidoId, nuevoEstado) => {
    try {
      const response = await fetch(`/api/pedidos-helados/${pedidoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        await fetchPedidos() // Recargar la lista
      } else {
        alert('Error al actualizar el estado del pedido')
      }
    } catch (error) {
      console.error('Error updating pedido:', error)
      alert('Error al actualizar el pedido')
    }
  }

  const handleDeletePedido = async (pedidoId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      return
    }

    try {
      const response = await fetch(`/api/pedidos-helados/${pedidoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPedidos() // Recargar la lista
      } else {
        alert('Error al eliminar el pedido')
      }
    } catch (error) {
      console.error('Error deleting pedido:', error)
      alert('Error al eliminar el pedido')
    }
  }

  const handleViewDetails = (pedido) => {
    setSelectedPedido(pedido)
    setShowDetails(true)
  }

  const parseSabores = (saboresJson) => {
    try {
      return JSON.parse(saboresJson)
    } catch (error) {
      console.error('Error parsing sabores:', error)
      return []
    }
  }

  const getTotalUnidades = (sabores) => {
    return sabores.reduce((total, sabor) => total + sabor.cantidad, 0)
  }

  const getEstadisticas = () => {
    const total = pedidos.length
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length
    const procesados = pedidos.filter(p => p.estado === 'procesado').length
    const entregados = pedidos.filter(p => p.estado === 'entregado').length

    return { total, pendientes, procesados, entregados }
  }

  const stats = getEstadisticas()

  return (
    <AdminLayout>
      <SidebarProvider
        style={{
          "--sidebar-width": "19rem",
          "--header-height": "4rem",
        }}
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <IceCream className="h-8 w-8 text-pink-500" />
                Pedidos de Helados
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestiona los pedidos de helados de los trabajadores
              </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
                  <IceCream className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Procesados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.procesados}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregados</CardTitle>
                  <Truck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.entregados}</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Pedidos */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pedidos</CardTitle>
                <CardDescription>
                  {pedidos.length} pedidos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando pedidos...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.length === 0 ? (
                      <div className="text-center py-8">
                        <IceCream className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay pedidos de helados</p>
                      </div>
                    ) : (
                      pedidos.map((pedido) => {
                        const sabores = parseSabores(pedido.sabores)
                        const totalUnidades = getTotalUnidades(sabores)
                        
                        return (
                          <div key={pedido.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(pedido.estado)}
                                  {getStatusBadge(pedido.estado)}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {pedido.trabajador.nombre}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(pedido.fechaPedido)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(pedido)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePedido(pedido.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Unidades</p>
                                <p className="text-lg font-bold text-blue-600">{totalUnidades}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sabores</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {sabores.length} tipo{sabores.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</p>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(pedido.estado)}
                                  <span className="text-sm capitalize">{pedido.estado}</span>
                                </div>
                              </div>
                            </div>

                            {/* Acciones de Estado */}
                            <div className="flex flex-wrap gap-2">
                              {pedido.estado === 'pendiente' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(pedido.id, 'procesado')}
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  Marcar como Procesado
                                </Button>
                              )}
                              {pedido.estado === 'procesado' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(pedido.id, 'entregado')}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  Marcar como Entregado
                                </Button>
                              )}
                              {pedido.estado === 'entregado' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(pedido.id, 'pendiente')}
                                  variant="outline"
                                >
                                  Revertir a Pendiente
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal de Detalles */}
      {showDetails && selectedPedido && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <IceCream className="h-6 w-6 text-pink-500" />
                  Detalles del Pedido
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Trabajador</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedPedido.trabajador.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedPedido.estado)}
                      {getStatusBadge(selectedPedido.estado)}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sabores Pedidos</p>
                  <div className="space-y-2">
                    {parseSabores(selectedPedido.sabores).map((sabor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{sabor.emoji}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{sabor.sabor}</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{sabor.cantidad} unidades</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Total del Pedido</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {getTotalUnidades(parseSabores(selectedPedido.sabores))} unidades
                  </p>
                </div>

                {selectedPedido.observaciones && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</p>
                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {selectedPedido.observaciones}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <p className="font-medium">Fecha del Pedido</p>
                    <p>{formatDate(selectedPedido.fechaPedido)}</p>
                  </div>
                  {selectedPedido.fechaProcesado && (
                    <div>
                      <p className="font-medium">Fecha Procesado</p>
                      <p>{formatDate(selectedPedido.fechaProcesado)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Cerrar
                </Button>
                {selectedPedido.estado === 'pendiente' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedPedido.id, 'procesado')
                      setShowDetails(false)
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Marcar como Procesado
                  </Button>
                )}
                {selectedPedido.estado === 'procesado' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedPedido.id, 'entregado')
                      setShowDetails(false)
                    }}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Marcar como Entregado
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}










