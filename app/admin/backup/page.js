"use client"

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, Database, Settings, Clock, HardDrive, AlertCircle } from "lucide-react"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function BackupPage() {
  const [backups, setBackups] = useState([])
  const [config, setConfig] = useState({
    autoBackup: false,
    interval: 'daily',
    lastBackup: null,
    maxBackups: 10
  })
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchBackupInfo()
  }, [])

  const fetchBackupInfo = async () => {
    try {
      const response = await fetch('/api/admin/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups)
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching backup info:', error)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create' })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Si estamos en producción (serverless), descargar directamente
        if (result.isServerless && result.backup.data) {
          // Crear blob con los datos del backup
          const blob = new Blob([result.backup.data], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.backup.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          alert(`✅ Backup creado y descargado exitosamente: ${result.backup.filename}`)
        } else {
          // En localhost, refrescar la lista
          await fetchBackupInfo()
          alert('✅ Backup creado exitosamente')
        }
      } else {
        alert('❌ Error al crear el backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('❌ Error al crear el backup')
    } finally {
      setCreating(false)
    }
  }

  const updateConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'update-config',
          config 
        })
      })

      if (response.ok) {
        alert('✅ Configuración actualizada exitosamente')
      } else {
        alert('❌ Error al actualizar la configuración')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      alert('❌ Error al actualizar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getIntervalLabel = (interval) => {
    const labels = {
      daily: 'Diario',
      weekly: 'Semanal', 
      monthly: 'Mensual'
    }
    return labels[interval] || interval
  }

  const handleDownloadBackup = async (fileName) => {
    try {
      const response = await fetch(`/api/admin/backup?download=${fileName}`)
      
      if (response.ok) {
        // Crear un blob con el contenido del archivo
        const blob = await response.blob()
        
        // Crear un enlace temporal para descargar
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        
        // Limpiar
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert('✅ Backup descargado exitosamente')
      } else {
        const errorData = await response.json()
        alert(`❌ Error al descargar: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      alert('❌ Error de red al descargar el backup')
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
              <div className="container mx-auto px-4 py-6 max-w-6xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">Backup de Base de Datos</h1>
                      <p className="text-muted-foreground mt-2">
                        Gestiona las copias de seguridad de tu base de datos
                      </p>
                    </div>
                    <Button 
                      onClick={createBackup} 
                      disabled={creating}
                      className="flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      {creating ? 'Creando...' : 'Crear Backup Ahora'}
                    </Button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{backups.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Archivos de respaldo
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {config.lastBackup 
                            ? format(new Date(config.lastBackup), 'dd/MM', { locale: es })
                            : 'Nunca'
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.lastBackup 
                            ? format(new Date(config.lastBackup), 'HH:mm', { locale: es })
                            : 'Sin backups'
                          }
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auto Backup</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {config.autoBackup ? 'Activo' : 'Inactivo'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.autoBackup ? getIntervalLabel(config.interval) : 'Manual'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuración de Backup Automático
                      </CardTitle>
                      <CardDescription>
                        Configura cuándo y con qué frecuencia se crearán backups automáticos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Backup Automático</label>
                          <p className="text-sm text-muted-foreground">
                            Activar backups automáticos programados
                          </p>
                        </div>
                        <Switch
                          checked={config.autoBackup}
                          onCheckedChange={(checked) => setConfig({...config, autoBackup: checked})}
                        />
                      </div>

                      {config.autoBackup && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Frecuencia</label>
                            <Select 
                              value={config.interval} 
                              onValueChange={(value) => setConfig({...config, interval: value})}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Diario</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Máximo de Backups</label>
                            <Select 
                              value={config.maxBackups.toString()} 
                              onValueChange={(value) => setConfig({...config, maxBackups: parseInt(value)})}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 backups</SelectItem>
                                <SelectItem value="10">10 backups</SelectItem>
                                <SelectItem value="20">20 backups</SelectItem>
                                <SelectItem value="30">30 backups</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Los backups más antiguos se eliminarán automáticamente
                            </p>
                          </div>
                        </>
                      )}

                      <Button 
                        onClick={updateConfig} 
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Backups List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Historial de Backups
                      </CardTitle>
                      <CardDescription>
                        Lista de todos los backups creados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {backups.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay backups disponibles</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Crea tu primer backup para comenzar
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {backups.map((backup, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{backup.filename}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{formatFileSize(backup.size)}</span>
                                    <span>•</span>
                                    <span>
                                      {format(new Date(backup.created), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <Badge variant="secondary">Más reciente</Badge>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadBackup(backup.filename)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </Button>
                              </div>
                            </div>
                          ))}
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
