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
import { formatCurrency, formatDate } from "@/lib/utils"
import { Clock, CheckCircle, XCircle, Eye, Trash2, Calendar } from "lucide-react"

export default function CierresPage() {
  const [cierres, setCierres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCierre, setSelectedCierre] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchCierres()
  }, [])

  const fetchCierres = async () => {
    try {
      const response = await fetch('/api/cierre')
      if (response.ok) {
        const data = await response.json()
        setCierres(data.cierres || [])
      }
    } catch (error) {
      console.error('Error fetching cierres:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (cierre) => {
    if (cierre.completado) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completado</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">En Progreso</Badge>
    }
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
        alert('Cierre eliminado exitosamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar el cierre')
      }
    } catch (error) {
      console.error('Error deleting cierre:', error)
      alert('Error al eliminar el cierre')
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

  const getProgressPercentage = (tareas) => {
    if (!tareas || tareas.length === 0) return 0
    const completadas = tareas.filter(t => t.completada).length
    return Math.round((completadas / tareas.length) * 100)
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
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">Gestión de Cierres</h1>
                    <p className="text-muted-foreground">
                      Administra y supervisa todos los procesos de cierre
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando cierres...</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cierres.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <p className="text-muted-foreground">No hay cierres registrados</p>
                      </div>
                    ) : (
                      cierres.map((cierre) => (
                        <Card key={cierre.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{cierre.trabajador}</CardTitle>
                              {getStatusBadge(cierre)}
                            </div>
                            <CardDescription>
                              Iniciado: {formatDate(cierre.fechaInicio)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {cierre.fechaFin ? 
                                    `Finalizado: ${formatDate(cierre.fechaFin)}` : 
                                    'En progreso'
                                  }
                                </span>
                              </div>
                              
                              {cierre.totalVentas && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    Ventas: {formatCurrency(cierre.totalVentas)}
                                  </span>
                                </div>
                              )}

                              {cierre.tareas && cierre.tareas.length > 0 && (
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progreso</span>
                                    <span>{getProgressPercentage(cierre.tareas)}%</span>
                                  </div>
                                  <div className="w-full bg-secondary rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${getProgressPercentage(cierre.tareas)}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {cierre.tareas.filter(t => t.completada).length} de {cierre.tareas.length} tareas completadas
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleViewDetails(cierre)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Detalles
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteCierre(cierre.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* Modal de detalles del cierre */}
                {showDetails && selectedCierre && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Detalles del Cierre</CardTitle>
                          <Button variant="outline" size="sm" onClick={closeDetails}>
                            ✕
                          </Button>
                        </div>
                        <CardDescription>
                          Cierre de {selectedCierre.trabajador} - {formatDate(selectedCierre.fechaInicio)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Información General</h4>
                            <div className="space-y-2 text-sm">
                              <div><strong>Trabajador:</strong> {selectedCierre.trabajador}</div>
                              <div><strong>Inicio:</strong> {formatDate(selectedCierre.fechaInicio)}</div>
                              {selectedCierre.fechaFin && (
                                <div><strong>Fin:</strong> {formatDate(selectedCierre.fechaFin)}</div>
                              )}
                              <div><strong>Estado:</strong> {selectedCierre.completado ? 'Completado' : 'En Progreso'}</div>
                              {selectedCierre.totalVentas && (
                                <div><strong>Ventas:</strong> {formatCurrency(selectedCierre.totalVentas)}</div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Progreso</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Tareas completadas</span>
                                <span>
                                  {selectedCierre.tareas?.filter(t => t.completada).length || 0} / {selectedCierre.tareas?.length || 0}
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${getProgressPercentage(selectedCierre.tareas)}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getProgressPercentage(selectedCierre.tareas)}% completado
                              </div>
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const fotos = getFotosFromTareas(selectedCierre.tareas)
                          return fotos.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">Fotos del Cierre</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {fotos.map((foto, index) => (
                                  <div key={`${foto.tareaId}-${index}`} className="relative group cursor-pointer">
                                    {foto.url ? (
                                      <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                                        <img 
                                          src={foto.url} 
                                          alt={`Foto ${index + 1}`}
                                          className="w-full h-24 object-cover hover:scale-105 transition-transform duration-200"
                                          onClick={() => {
                                            // Crear modal de ampliación
                                            const modal = document.createElement('div')
                                            modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'
                                            modal.innerHTML = `
                                              <div class="relative max-w-4xl max-h-[90vh]">
                                                <img 
                                                  src="${foto.url}" 
                                                  alt="Foto ampliada"
                                                  class="max-w-full max-h-full object-contain rounded-lg"
                                                />
                                                <button 
                                                  onclick="this.parentElement.parentElement.remove()"
                                                  class="absolute top-4 right-4 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors"
                                                >
                                                  ✕
                                                </button>
                                                <div class="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded">
                                                  ${foto.tipo} - Foto ${index + 1}
                                                </div>
                                              </div>
                                            `
                                            document.body.appendChild(modal)
                                            
                                            // Cerrar modal al hacer click fuera de la imagen
                                            modal.addEventListener('click', (e) => {
                                              if (e.target === modal) {
                                                modal.remove()
                                              }
                                            })
                                          }}
                                        />
                                        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                          {index + 1}
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                          {foto.tipo}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <div className="text-center text-muted-foreground">
                                          <div className="text-lg mb-1">📷</div>
                                          <div className="text-xs">No disponible</div>
                                        </div>
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
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AdminLayout>
  )
}
