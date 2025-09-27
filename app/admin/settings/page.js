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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle, Clock, Users, Camera, Bell } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    general: {
      nombreTienda: "Evas Barcelona",
      direccion: "Barcelona, España",
      telefono: "+34 123 456 789",
      email: "admin@evasbarcelona.com",
      timezone: "Europe/Madrid"
    },
    cierres: {
      tiempoLimite: 45,
      requiereFotos: true,
      validacionAutomatica: false,
      notificacionesEmail: true,
      backupAutomatico: true
    },
    trabajadores: {
      maxTrabajadores: 50,
      requiereValidacion: true,
      permisosFotos: true,
      sessionTimeout: 120
    },
    sistema: {
      modoDebug: false,
      logLevel: "info",
      cacheEnabled: true,
      compressionEnabled: true
    }
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert('Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      // Reset logic here
      console.log('Resetting to defaults...')
    }
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
                    <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
                    <p className="text-muted-foreground">
                      Personaliza y configura el comportamiento de la aplicación
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetToDefaults}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restaurar
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? 'Guardado' : 'Guardar'}
                    </Button>
                  </div>
                </div>

                {saved && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">Configuración guardada correctamente</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Configuración General */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle>Configuración General</CardTitle>
                      </div>
                      <CardDescription>
                        Información básica de la tienda y configuración general
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="nombreTienda">Nombre de la Tienda</Label>
                          <Input
                            id="nombreTienda"
                            value={settings.general.nombreTienda}
                            onChange={(e) => handleInputChange('general', 'nombreTienda', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefono">Teléfono</Label>
                          <Input
                            id="telefono"
                            value={settings.general.telefono}
                            onChange={(e) => handleInputChange('general', 'telefono', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                          id="direccion"
                          value={settings.general.direccion}
                          onChange={(e) => handleInputChange('general', 'direccion', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email de Contacto</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.general.email}
                            onChange={(e) => handleInputChange('general', 'email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Zona Horaria</Label>
                          <Select 
                            value={settings.general.timezone} 
                            onValueChange={(value) => handleInputChange('general', 'timezone', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Europe/Madrid">Europa/Madrid</SelectItem>
                              <SelectItem value="Europe/London">Europa/Londres</SelectItem>
                              <SelectItem value="America/New_York">América/Nueva York</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración de Cierres */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <CardTitle>Configuración de Cierres</CardTitle>
                      </div>
                      <CardDescription>
                        Parámetros del proceso de cierre de tienda
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tiempoLimite">Tiempo Límite por Tarea (minutos)</Label>
                        <Input
                          id="tiempoLimite"
                          type="number"
                          value={settings.cierres.tiempoLimite}
                          onChange={(e) => handleInputChange('cierres', 'tiempoLimite', parseInt(e.target.value))}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Requerir Fotos en Tareas</Label>
                            <p className="text-sm text-muted-foreground">
                              Obligar a los trabajadores a subir fotos en ciertas tareas
                            </p>
                          </div>
                          <Switch
                            checked={settings.cierres.requiereFotos}
                            onCheckedChange={(checked) => handleInputChange('cierres', 'requiereFotos', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Validación Automática</Label>
                            <p className="text-sm text-muted-foreground">
                              Validar automáticamente las tareas completadas
                            </p>
                          </div>
                          <Switch
                            checked={settings.cierres.validacionAutomatica}
                            onCheckedChange={(checked) => handleInputChange('cierres', 'validacionAutomatica', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Notificaciones por Email</Label>
                            <p className="text-sm text-muted-foreground">
                              Enviar notificaciones cuando se complete un cierre
                            </p>
                          </div>
                          <Switch
                            checked={settings.cierres.notificacionesEmail}
                            onCheckedChange={(checked) => handleInputChange('cierres', 'notificacionesEmail', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Backup Automático</Label>
                            <p className="text-sm text-muted-foreground">
                              Crear respaldos automáticos de los datos
                            </p>
                          </div>
                          <Switch
                            checked={settings.cierres.backupAutomatico}
                            onCheckedChange={(checked) => handleInputChange('cierres', 'backupAutomatico', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración de Trabajadores */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>Gestión de Trabajadores</CardTitle>
                      </div>
                      <CardDescription>
                        Configuración relacionada con el equipo de trabajo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="maxTrabajadores">Máximo de Trabajadores</Label>
                          <Input
                            id="maxTrabajadores"
                            type="number"
                            value={settings.trabajadores.maxTrabajadores}
                            onChange={(e) => handleInputChange('trabajadores', 'maxTrabajadores', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sessionTimeout">Timeout de Sesión (minutos)</Label>
                          <Input
                            id="sessionTimeout"
                            type="number"
                            value={settings.trabajadores.sessionTimeout}
                            onChange={(e) => handleInputChange('trabajadores', 'sessionTimeout', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Requerir Validación de Nuevos Trabajadores</Label>
                            <p className="text-sm text-muted-foreground">
                              Los nuevos trabajadores deben ser aprobados por un administrador
                            </p>
                          </div>
                          <Switch
                            checked={settings.trabajadores.requiereValidacion}
                            onCheckedChange={(checked) => handleInputChange('trabajadores', 'requiereValidacion', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Permisos de Cámara</Label>
                            <p className="text-sm text-muted-foreground">
                              Permitir a los trabajadores acceder a la cámara para fotos
                            </p>
                          </div>
                          <Switch
                            checked={settings.trabajadores.permisosFotos}
                            onCheckedChange={(checked) => handleInputChange('trabajadores', 'permisosFotos', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración del Sistema */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle>Configuración del Sistema</CardTitle>
                        <Badge variant="secondary">Avanzado</Badge>
                      </div>
                      <CardDescription>
                        Configuraciones técnicas del sistema (solo para administradores)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="logLevel">Nivel de Log</Label>
                        <Select 
                          value={settings.sistema.logLevel} 
                          onValueChange={(value) => handleInputChange('sistema', 'logLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="debug">Debug</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Modo Debug</Label>
                            <p className="text-sm text-muted-foreground">
                              Activar información de depuración detallada
                            </p>
                          </div>
                          <Switch
                            checked={settings.sistema.modoDebug}
                            onCheckedChange={(checked) => handleInputChange('sistema', 'modoDebug', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Cache Habilitado</Label>
                            <p className="text-sm text-muted-foreground">
                              Usar caché para mejorar el rendimiento
                            </p>
                          </div>
                          <Switch
                            checked={settings.sistema.cacheEnabled}
                            onCheckedChange={(checked) => handleInputChange('sistema', 'cacheEnabled', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Compresión Habilitada</Label>
                            <p className="text-sm text-muted-foreground">
                              Comprimir respuestas para reducir el ancho de banda
                            </p>
                          </div>
                          <Switch
                            checked={settings.sistema.compressionEnabled}
                            onCheckedChange={(checked) => handleInputChange('sistema', 'compressionEnabled', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AdminLayout>
  )
}
