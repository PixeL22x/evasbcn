"use client"

import { useState, useEffect } from "react"
import AdminLayout from '../../../components/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Calendar, Search, LogIn, LogOut, CheckCircle2 } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function FichajesPage() {
  const [fichajes, setFichajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchFichajes(page)
  }, [page])

  const fetchFichajes = async (pageNum = page) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fichaje?page=${pageNum}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setFichajes(data.registros || [])
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('Error cargando fichajes:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatHora = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatFecha = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  }

  const calcularHoras = (entrada, salida) => {
    if (!entrada || !salida) return "En curso"
    const diffMs = new Date(salida) - new Date(entrada)
    const diffHrs = diffMs / (1000 * 60 * 60)
    return diffHrs.toFixed(2) + " h"
  }

  return (
    <AdminLayout>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              Fichajes (Entradas y Salidas)
            </h1>
            <p className="text-muted-foreground mt-1">
              Registro automático de horas de los trabajadores basado en inicio y cierre de sesión.
            </p>
          </div>
          <Button onClick={() => fetchFichajes(page)} variant="outline" className="gap-2">
            <Search className="h-4 w-4" /> Actualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Fichajes</CardTitle>
            <CardDescription>
              Muestra los registros ordenados desde el más reciente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : fichajes.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">No hay fichajes registrados</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Los trabajadores aparecerán aquí cuando inicien sesión en el sistema.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Trabajador</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-center">Entrada</TableHead>
                      <TableHead className="text-center">Salida</TableHead>
                      <TableHead className="text-center">Total Horas</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fichajes.map((fichaje) => (
                      <TableRow key={fichaje.id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {fichaje.trabajador?.nombre?.charAt(0).toUpperCase()}
                            </div>
                            {fichaje.trabajador?.nombre}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatFecha(fichaje.fecha)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/15 text-green-700 dark:text-green-400 font-medium">
                            <LogIn className="h-3.5 w-3.5" />
                            {formatHora(fichaje.entrada)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {fichaje.salida ? (
                            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">
                              <LogOut className="h-3.5 w-3.5" />
                              {formatHora(fichaje.salida)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Sin registrar</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {calcularHoras(fichaje.entrada, fichaje.salida)}
                        </TableCell>
                        <TableCell className="text-right">
                          {fichaje.salida ? (
                            <Badge variant="outline" className="gap-1 pr-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              Completado
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500 hover:bg-blue-600 shadow-sm animate-pulse">
                              Activo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
