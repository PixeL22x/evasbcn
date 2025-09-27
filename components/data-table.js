"use client"

import { useState, useEffect } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DataTable({ data: initialData }) {
  const [cierres, setCierres] = useState(initialData || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!initialData) {
      fetchCierres()
    }
  }, [initialData])

  const fetchCierres = async () => {
    setLoading(true)
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cierres Recientes</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>Cierres Recientes</CardTitle>
          <CardDescription>
            Historial de los últimos cierres completados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-4 font-medium">Trabajador</th>
                  <th className="text-left p-2 sm:p-4 font-medium">Fecha Inicio</th>
                  <th className="text-left p-2 sm:p-4 font-medium">Fecha Fin</th>
                  <th className="text-left p-2 sm:p-4 font-medium">Total Ventas</th>
                  <th className="text-left p-2 sm:p-4 font-medium">Estado</th>
                  <th className="text-left p-2 sm:p-4 font-medium">Tareas</th>
                </tr>
              </thead>
              <tbody>
                {cierres.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      No hay cierres registrados
                    </td>
                  </tr>
                ) : (
                  cierres.slice(0, 10).map((cierre) => (
                    <tr key={cierre.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">{cierre.trabajador}</div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {formatDate(cierre.fechaInicio)}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {cierre.fechaFin ? formatDate(cierre.fechaFin) : '-'}
                      </td>
                      <td className="p-2">
                        <div className="font-medium">
                          {cierre.totalVentas ? formatCurrency(cierre.totalVentas) : '-'}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cierre.completado 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {cierre.completado ? 'Completado' : 'En Progreso'}
                        </div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {cierre.tareas ? 
                          `${cierre.tareas.filter(t => t.completada).length}/${cierre.tareas.length}` 
                          : '0/0'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
  )
}
