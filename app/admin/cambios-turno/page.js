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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Calendar, User, MessageSquare, Trash2 } from "lucide-react"
import { useSolicitudesCount } from "@/hooks/use-solicitudes-count"

export default function CambiosTurnoPage() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [observaciones, setObservaciones] = useState({})
  const { refetch: refetchCount } = useSolicitudesCount()

  useEffect(() => {
    fetchSolicitudes()
  }, [])

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch('/api/solicitudes-cambio')
      if (response.ok) {
        const data = await response.json()
        setSolicitudes(data)
      }
    } catch (error) {
      console.error('Error fetching solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSolicitud = async (id, estado) => {
    setProcessingId(id)
    
    try {
      const response = await fetch(`/api/solicitudes-cambio/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado,
          observacionesAdmin: observaciones[id] || ''
        }),
      })

      if (response.ok) {
        fetchSolicitudes()
        refetchCount() // Actualizar el contador en el sidebar
        setObservaciones(prev => ({ ...prev, [id]: '' }))
        alert(`Solicitud ${estado} correctamente`)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al procesar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSolicitud = async (id, trabajadorSolicitante) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la solicitud de ${trabajadorSolicitante}?`)) {
      return
    }

    setProcessingId(id)
    
    try {
      const response = await fetch(`/api/solicitudes-cambio/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSolicitudes()
        refetchCount() // Actualizar el contador en el sidebar
        alert('Solicitud eliminada correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
      case 'aprobada':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobada
          </Badge>
        )
      case 'rechazada':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString)
    // Ajustar por zona horaria para obtener la fecha correcta
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  const getSolicitudesStats = () => {
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length
    const aprobadas = solicitudes.filter(s => s.estado === 'aprobada').length
    const rechazadas = solicitudes.filter(s => s.estado === 'rechazada').length
    
    return { pendientes, aprobadas, rechazadas, total: solicitudes.length }
  }

  const stats = getSolicitudesStats()


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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-2">
                        <RefreshCw className="h-8 w-8" />
                        Gestión de Cambios de Turno
                      </h1>
                      <p className="text-muted-foreground">
                        Administra las solicitudes de cambio de turno de los trabajadores
                      </p>
                    </div>
                    <Button onClick={fetchSolicitudes} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.pendientes}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.aprobadas}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.rechazadas}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de solicitudes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Solicitudes de Cambio</CardTitle>
                      <CardDescription>
                        Gestiona las solicitudes de cambio de turno de los trabajadores.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Cargando solicitudes...</p>
                        </div>
                      ) : solicitudes.length === 0 ? (
                        <div className="text-center py-12">
                          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No hay solicitudes</h3>
                          <p className="text-muted-foreground">
                            No se han recibido solicitudes de cambio de turno
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {solicitudes.map((solicitud) => {
                            return (
                              <div key={solicitud.id} className="border rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {solicitud.trabajadorSolicitante} → {solicitud.trabajadorDestino}
                                      </span>
                                      {getEstadoBadge(solicitud.estado)}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="h-4 w-4 text-red-500" />
                                      <span><strong>NO trabaja:</strong> {formatDateOnly(solicitud.fechaCambio)}</span>
                                    </div>

                                    {solicitud.fechaReemplazo && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-green-500" />
                                        <span><strong>Trabaja en su lugar:</strong> {formatDateOnly(solicitud.fechaReemplazo)}</span>
                                      </div>
                                    )}
                                    
                                    <div className="text-sm text-muted-foreground">
                                      Solicitado: {formatDate(solicitud.fechaSolicitud)}
                                    </div>

                                    {solicitud.motivo && (
                                      <div className="text-sm">
                                        <strong>Motivo:</strong> {solicitud.motivo}
                                      </div>
                                    )}


                                    {solicitud.observacionesAdmin && (
                                      <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                        <strong className="text-gray-900 dark:text-gray-100">Observaciones admin:</strong> 
                                        <span className="text-gray-700 dark:text-gray-300"> {solicitud.observacionesAdmin}</span>
                                      </div>
                                    )}

                                    {solicitud.fechaRespuesta && (
                                      <div className="text-sm text-muted-foreground">
                                        Respondido: {formatDate(solicitud.fechaRespuesta)}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Botón eliminar para solicitudes procesadas */}
                                  {solicitud.estado !== 'pendiente' && (
                                    <div className="mt-4 pt-4 border-t">
                                      <Button
                                        onClick={() => handleDeleteSolicitud(solicitud.id, solicitud.trabajadorSolicitante)}
                                        disabled={processingId === solicitud.id}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {processingId === solicitud.id ? 'Eliminando...' : 'Eliminar'}
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Acciones para solicitudes pendientes */}
                                {solicitud.estado === 'pendiente' && (
                                  <div className="space-y-3 border-t pt-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Observaciones (opcional)
                                      </label>
                                      <Textarea
                                        value={observaciones[solicitud.id] || ''}
                                        onChange={(e) => setObservaciones(prev => ({
                                          ...prev,
                                          [solicitud.id]: e.target.value
                                        }))}
                                        placeholder="Agregar observaciones sobre la decisión..."
                                        rows={2}
                                      />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleUpdateSolicitud(solicitud.id, 'aprobada')}
                                        disabled={processingId === solicitud.id}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {processingId === solicitud.id ? 'Procesando...' : 'Aprobar'}
                                      </Button>
                                      
                                      <Button
                                        onClick={() => handleUpdateSolicitud(solicitud.id, 'rechazada')}
                                        disabled={processingId === solicitud.id}
                                        variant="destructive"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {processingId === solicitud.id ? 'Procesando...' : 'Rechazar'}
                                      </Button>
                                      
                                      <Button
                                        onClick={() => handleDeleteSolicitud(solicitud.id, solicitud.trabajadorSolicitante)}
                                        disabled={processingId === solicitud.id}
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {processingId === solicitud.id ? 'Eliminando...' : 'Eliminar'}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
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
