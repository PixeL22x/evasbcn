"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, User, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useSolicitudesCount } from "@/hooks/use-solicitudes-count"

export default function CambioTurno({ trabajadorActual }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    trabajadorDestino: '',
    fechaCambio: '',
    fechaReemplazo: '',
    motivo: ''
  })
  const { refetch: refetchCount } = useSolicitudesCount()

  useEffect(() => {
    fetchSolicitudes()
  }, [])

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch(`/api/solicitudes-cambio?trabajador=${trabajadorActual}`)
      if (response.ok) {
        const data = await response.json()
        setSolicitudes(data)
      }
    } catch (error) {
      console.error('Error fetching solicitudes:', error)
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/solicitudes-cambio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trabajadorSolicitante: trabajadorActual,
          ...formData
        }),
      })

      if (response.ok) {
        setFormData({
          trabajadorDestino: '',
          fechaCambio: '',
          fechaReemplazo: '',
          motivo: ''
        })
        fetchSolicitudes()
        refetchCount() // Actualizar el contador en el sidebar
        alert('Solicitud enviada correctamente')
        
        // Mostrar mensaje de redirección
        setTimeout(() => {
          alert('Redirigiendo a la página principal...')
          window.location.href = '/'
        }, 500)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al enviar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
      case 'aprobada':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>
      case 'rechazada':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    // Ajustar por zona horaria para obtener la fecha correcta
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  // Calcular fecha mínima (2 semanas desde hoy)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 14)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Formulario para nueva solicitud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Solicitar Cambio de Turno
          </CardTitle>
          <CardDescription>
            Solicita un cambio de turno con otro trabajador. La solicitud debe hacerse mínimo 2 semanas antes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="trabajadorDestino">Trabajador con quien cambiar</Label>
              <Input
                type="text"
                id="trabajadorDestino"
                value={formData.trabajadorDestino}
                onChange={(e) => setFormData({...formData, trabajadorDestino: e.target.value})}
                placeholder="Nombre del trabajador"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Escribe el nombre completo del trabajador
              </p>
            </div>

            <div>
              <Label htmlFor="fechaCambio">Fecha que NO puedes trabajar</Label>
              <Input
                type="date"
                id="fechaCambio"
                value={formData.fechaCambio}
                onChange={(e) => setFormData({...formData, fechaCambio: e.target.value})}
                min={minDateString}
                placeholder="dd/mm/aaaa"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Tu fecha asignada que no puedes cubrir (mínimo 2 semanas después)
              </p>
            </div>

            <div>
              <Label htmlFor="fechaReemplazo">Fecha que propones trabajar en su lugar</Label>
              <Input
                type="date"
                id="fechaReemplazo"
                value={formData.fechaReemplazo}
                onChange={(e) => setFormData({...formData, fechaReemplazo: e.target.value})}
                min={minDateString}
                placeholder="dd/mm/aaaa"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                La fecha en que trabajarías en lugar del otro trabajador (mínimo 2 semanas después)
              </p>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                placeholder="Explica el motivo del cambio..."
                rows={3}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </form>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Importante:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Hacer la solicitud mínimo 2 semanas antes</li>
              <li>• Especificar claramente ambas fechas (la que no puedes y la que propones)</li>
              <li>• Escribir el nombre completo del trabajador</li>
              <li>• El motivo es obligatorio</li>
              <li>• Respuesta en 1-2 días</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Lista de solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mis Solicitudes
          </CardTitle>
          <CardDescription>
            Historial de tus solicitudes de cambio de turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No tienes solicitudes de cambio de turno
            </p>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((solicitud) => (
                <div key={solicitud.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {solicitud.trabajadorSolicitante === trabajadorActual 
                          ? `Cambio con ${solicitud.trabajadorDestino}`
                          : `${solicitud.trabajadorSolicitante} quiere cambiar contigo`
                        }
                      </span>
                    </div>
                    {getEstadoBadge(solicitud.estado)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>NO trabaja:</strong> {formatDate(solicitud.fechaCambio)}</p>
                    {solicitud.fechaReemplazo && (
                      <p><strong>Trabaja en su lugar:</strong> {formatDate(solicitud.fechaReemplazo)}</p>
                    )}
                    <p><strong>Solicitado:</strong> {formatDate(solicitud.fechaSolicitud)}</p>
                    {solicitud.motivo && (
                      <p><strong className="text-gray-900 dark:text-gray-100">Motivo:</strong> <span className="text-gray-700 dark:text-gray-300">{solicitud.motivo}</span></p>
                    )}
                    {solicitud.observacionesAdmin && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <p><strong className="text-gray-900 dark:text-gray-100">Observaciones:</strong> <span className="text-gray-700 dark:text-gray-300">{solicitud.observacionesAdmin}</span></p>
                      </div>
                    )}
                    {solicitud.fechaRespuesta && (
                      <p><strong>Respondido:</strong> {formatDate(solicitud.fechaRespuesta)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
