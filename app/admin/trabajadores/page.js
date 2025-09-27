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
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { Users, Plus, Search, Edit, Trash2 } from "lucide-react"

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTrabajador, setEditingTrabajador] = useState(null)
  const [formData, setFormData] = useState({
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
      } else {
        console.error('Error response:', response.status)
      }
    } catch (error) {
      console.error('Error fetching trabajadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrabajadores = trabajadores.filter(trabajador =>
    trabajador.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )


  const handleAddTrabajador = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchTrabajadores()
        setShowAddForm(false)
        setFormData({ nombre: '', password: '', activo: true })
      }
    } catch (error) {
      console.error('Error adding trabajador:', error)
    }
  }

  const handleEditTrabajador = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/trabajadores/${editingTrabajador.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchTrabajadores()
        setEditingTrabajador(null)
        setFormData({ nombre: '', password: '', activo: true })
      }
    } catch (error) {
      console.error('Error editing trabajador:', error)
    }
  }

  const handleDeleteTrabajador = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este trabajador?')) return
    
    try {
      const response = await fetch(`/api/trabajadores/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTrabajadores()
      }
    } catch (error) {
      console.error('Error deleting trabajador:', error)
    }
  }

  const startEdit = (trabajador) => {
    setEditingTrabajador(trabajador)
    setFormData({
      nombre: trabajador.nombre,
      password: '',
      activo: trabajador.activo
    })
  }

  const cancelEdit = () => {
    setEditingTrabajador(null)
    setFormData({ nombre: '', password: '', activo: true })
  }

  const getStatusBadge = (activo) => {
    return activo ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Activo</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Inactivo</Badge>
    )
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
                    <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
                    <p className="text-muted-foreground">
                      Administra el equipo de trabajo de Evas Barcelona
                    </p>
                  </div>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Trabajador
                  </Button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar trabajadores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {filteredTrabajadores.length} trabajadores
                    </span>
                  </div>
                </div>


                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando trabajadores...</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTrabajadores.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <p className="text-muted-foreground">
                          {searchTerm ? 'No se encontraron trabajadores' : 'No hay trabajadores registrados'}
                        </p>
                      </div>
                    ) : (
                      filteredTrabajadores.map((trabajador) => (
                        <Card key={trabajador.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{trabajador.nombre}</CardTitle>
                              {getStatusBadge(trabajador.activo)}
                            </div>
                            {trabajador.email && (
                              <CardDescription>{trabajador.email}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {trabajador.telefono && (
                                <div className="text-sm">
                                  <span className="font-medium">Teléfono: </span>
                                  {trabajador.telefono}
                                </div>
                              )}
                              
                              {trabajador.turno && (
                                <div className="text-sm">
                                  <span className="font-medium">Turno: </span>
                                  {trabajador.turno}
                                </div>
                              )}

                              <div className="text-sm text-muted-foreground">
                                Registrado: {formatDate(trabajador.createdAt)}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => startEdit(trabajador)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTrabajador(trabajador.id)}
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

                {/* Formulario para agregar trabajador */}
                {showAddForm && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Agregar Nuevo Trabajador</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddTrabajador} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Nombre</label>
                            <Input
                              value={formData.nombre}
                              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Contraseña</label>
                            <Input
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="activo"
                            checked={formData.activo}
                            onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                          />
                          <label htmlFor="activo" className="text-sm font-medium">Activo</label>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Agregar</Button>
                          <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Formulario para editar trabajador */}
                {editingTrabajador && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Editar Trabajador</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleEditTrabajador} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Nombre</label>
                            <Input
                              value={formData.nombre}
                              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Nueva Contraseña (dejar vacío para mantener la actual)</label>
                            <Input
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="activo-edit"
                            checked={formData.activo}
                            onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                          />
                          <label htmlFor="activo-edit" className="text-sm font-medium">Activo</label>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Guardar</Button>
                          <Button type="button" variant="outline" onClick={cancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
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
