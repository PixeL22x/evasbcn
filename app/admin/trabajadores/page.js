"use client"

import { useState, useEffect } from "react"
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { Users, Plus, Search, MoreVertical, FileText, Briefcase, Mail, Phone, Calendar as CalendarIcon, Filter } from "lucide-react"
import { WorkerDetails } from "@/components/admin/trabajadores/WorkerDetails"

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [activeTab, setActiveTab] = useState("activos")

  const [addFormData, setAddFormData] = useState({
    nombre: '',
    password: '',
    activo: true
  })

  useEffect(() => {
    fetchTrabajadores()
  }, [])

  const fetchTrabajadores = async () => {
    try {
      const response = await fetch('/api/trabajadores')
      if (response.ok) {
        const data = await response.json()
        setTrabajadores(data.trabajadores || [])
      }
    } catch (error) {
      console.error('Error fetching trabajadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTrabajador = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData)
      })

      if (response.ok) {
        await fetchTrabajadores()
        setShowAddForm(false)
        setAddFormData({ nombre: '', password: '', activo: true })
      }
    } catch (error) {
      console.error('Error adding trabajador:', error)
    }
  }

  const handleDeleteTrabajador = async (id, e) => {
    e?.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar este registro permanentemente?')) return

    try {
      const response = await fetch(`/api/trabajadores/${id}`, { method: 'DELETE' })
      if (response.ok) fetchTrabajadores()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const filteredTrabajadores = trabajadores
    .filter(t => t.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => activeTab === "all" ? true : (activeTab === "activos" ? t.activo : !t.activo))

  const WorkerRow = ({ worker }) => (
    <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedWorker(worker)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${worker.activo ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent'}`}>
            {worker.nombre.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-base">{worker.nombre}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${worker.activo ? 'bg-green-500' : 'bg-red-400'}`} />
              {worker.activo ? 'Disponible' : 'Baja / Inactivo'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize font-normal text-muted-foreground bg-muted/30">
          <Briefcase className="h-3 w-3 mr-1 opacity-70" />
          {worker.cargo}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-col text-sm text-muted-foreground gap-0.5">
          {worker.email ? (
            <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {worker.email}</div>
          ) : <span className="text-xs opacity-50">- Sin email -</span>}
          {worker.telefono ? (
            <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {worker.telefono}</div>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3 opacity-70" />
          {formatDate(worker.fechaAlta || worker.createdAt)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedWorker(worker)}>
              <FileText className="mr-2 h-4 w-4" /> Ver Expediente
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => handleDeleteTrabajador(worker.id, e)}>
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  return (
    <AdminLayout>
      <SidebarProvider style={{ "--sidebar-width": "19rem", "--header-height": "4rem" }}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden bg-background">
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-6 py-8 max-w-[1400px]">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Plantilla</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Gestiona el personal, contratos y documentación laboral.
                    </p>
                  </div>
                  <Button onClick={() => setShowAddForm(true)} className="shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Empleado
                  </Button>
                </div>

                {/* Filters & Tabs */}
                <Card className="mb-6 border-none shadow-sm bg-muted/20">
                  <div className="p-2 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, cargo..."
                        className="pl-9 bg-background border-transparent focus:border-input shadow-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                      <TabsList className="grid w-full grid-cols-3 bg-background/50">
                        <TabsTrigger value="activos" className="text-xs">Activos</TabsTrigger>
                        <TabsTrigger value="inactivos" className="text-xs">Bajas</TabsTrigger>
                        <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </Card>

                {/* Content */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
                    <Users className="h-10 w-10 mb-4 opacity-20" />
                    <p>Cargando datos del personal...</p>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[300px]">Empleado</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead className="hidden md:table-cell">Contacto</TableHead>
                          <TableHead className="hidden lg:table-cell">Fecha Alta</TableHead>
                          <TableHead className="text-right w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTrabajadores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                              No se encontraron empleados en esta vista.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTrabajadores.map(worker => <WorkerRow key={worker.id} worker={worker} />)
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border-muted">
            <CardHeader>
              <CardTitle>Alta Rápida</CardTitle>
              <CardDescription>Crea un perfil básico para empezar.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTrabajador} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Nombre</label>
                  <Input
                    value={addFormData.nombre}
                    onChange={e => setAddFormData({ ...addFormData, nombre: e.target.value })}
                    className="bg-muted/30"
                    placeholder="Ej. Juan Pérez"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Clave de Acceso</label>
                  <Input
                    type="password"
                    value={addFormData.password}
                    onChange={e => setAddFormData({ ...addFormData, password: e.target.value })}
                    className="bg-muted/30"
                    placeholder="••••"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 shadow-md">
                    Crear Perfil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details (RRHH) Modal */}
      {selectedWorker && (
        <WorkerDetails
          trabajador={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onUpdate={(u) => {
            setTrabajadores(prev => prev.map(w => w.id === u.id ? u : w))
            setSelectedWorker(u)
          }}
        />
      )}
    </AdminLayout>
  )
}
