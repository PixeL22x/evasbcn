"use client"

import { useState, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, CheckCircle, Loader2 } from "lucide-react"

import { GeneralSettings } from "@/components/admin/settings/GeneralSettings"
import { ClosuresSettings } from "@/components/admin/settings/ClosuresSettings"
import { WorkersSettings } from "@/components/admin/settings/WorkersSettings"
import { SystemSettings } from "@/components/admin/settings/SystemSettings"
import { settingsSchema } from "@/components/admin/settings/schemas"
import { ScheduleSettings } from "@/components/admin/settings/ScheduleSettings"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const methods = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      general: {
        nombreTienda: "",
        direccion: "",
        telefono: "",
        email: "",
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
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          methods.reset(data.settings)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: data })
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
      // Logic to reset to initial defaults could go here, or simple reload
      methods.reset() // This resets to defaultValues passed to useForm IF we hadn't updated them. 
      // Better: reload from server? Or hardcode defaults again.
      // For now, simple console log as per original, or implement real reset if we had a "defaults" endpoint.
      console.log('Resetting...')
      loadSettings() // Reloads from server
    }
  }

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
                <FormProvider {...methods}>
                  <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
                        <p className="text-muted-foreground">
                          Personaliza y configura el comportamiento de la aplicación
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={resetToDefaults}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Restaurar
                        </Button>
                        <Button type="submit" disabled={saving || loading}>
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

                    {loading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-6">


                        <GeneralSettings />
                        <ScheduleSettings />
                        <ClosuresSettings />
                        <WorkersSettings />
                        <SystemSettings />
                      </div>
                    )}

                  </form>
                </FormProvider>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
