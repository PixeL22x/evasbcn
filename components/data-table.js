"use client"

import { useState, useEffect } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  const [visibleCount, setVisibleCount] = useState(3)
  const [loadingMore, setLoadingMore] = useState(false)

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

  const loadMoreCierres = () => {
    setLoadingMore(true)
    // Simular carga (en realidad los datos ya están cargados)
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 5, cierres.length))
      setLoadingMore(false)
    }, 500)
  }

  const resetView = () => {
    setVisibleCount(5)
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
          Últimos cierres completados
        </CardDescription>
      </CardHeader>
      <div className="px-4 py-3">
        {/* Vista Mobile - Cards */}
        <div className="block lg:hidden space-y-2">
          {cierres.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cierres registrados
            </div>
          ) : (
            <>
              {cierres.slice(0, visibleCount).map((cierre) => (
                <div
                  key={cierre.id}
                  className="p-3 rounded-xl bg-background/50 hover:bg-background active:bg-muted/50 transition-all touch-manipulation"
                  style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}
                >
                  {/* Compact inline layout */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-semibold text-sm tracking-tight truncate">{cierre.trabajador}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">
                        {new Date(cierre.fechaInicio).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground font-medium">Ventas</div>
                        <div className="text-lg font-bold tracking-tight text-blue-500">
                          {cierre.totalVentas ? formatCurrency(cierre.totalVentas) : '€0'}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cierre.completado ? 'bg-green-500' : 'bg-yellow-500'
                        }`} title={cierre.completado ? 'Completado' : 'En Progreso'} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Vista Desktop - Tabla */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Trabajador</th>
                <th className="text-left p-4 font-medium">Fecha Inicio</th>
                <th className="text-left p-4 font-medium">Fecha Fin</th>
                <th className="text-left p-4 font-medium">Total Ventas</th>
                <th className="text-left p-4 font-medium">Estado</th>
                <th className="text-left p-4 font-medium">Tareas</th>
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
                <>
                  {cierres.slice(0, visibleCount).map((cierre, index) => (
                    <tr key={cierre.id} className={`border-b hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
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
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cierre.completado
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
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de carga incremental */}
        {cierres.length > 5 && (
          <div className="flex justify-center items-center gap-3 mt-4">
            {visibleCount < cierres.length ? (
              <Button
                variant="outline"
                onClick={loadMoreCierres}
                disabled={loadingMore}
                className="px-6 py-2.5 sm:py-2 touch-manipulation"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Cargando...
                  </>
                ) : (
                  `Cargar 5 más`
                )}
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                Mostrando todos los cierres ({cierres.length})
              </div>
            )}

            {visibleCount > 5 && (
              <Button
                variant="ghost"
                onClick={resetView}
                className="px-4 text-sm py-2.5 sm:py-2 touch-manipulation"
              >
                Ver menos
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
