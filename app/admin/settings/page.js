"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, RefreshCw, CheckCircle, Loader2, Lock } from "lucide-react"

import { GeneralSettings } from "@/components/admin/settings/GeneralSettings"
import { ClosuresSettings } from "@/components/admin/settings/ClosuresSettings"
import { WorkersSettings } from "@/components/admin/settings/WorkersSettings"
import { SystemSettings } from "@/components/admin/settings/SystemSettings"
import { settingsSchema } from "@/components/admin/settings/schemas"
import { ScheduleSettings } from "@/components/admin/settings/ScheduleSettings"
import { StorageMonitor } from "@/components/admin/settings/StorageMonitor"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const closuresRef = useRef(null)

  // Security state
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [shake, setShake] = useState(false)

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

  const handleUnlock = async () => {
    if (!passwordInput.trim()) return

    try {
      setVerifying(true)
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() })
      })

      const data = await res.json()

      if (data.valid) {
        setIsUnlocked(true)
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setPasswordInput("") // Clear input on error
        // Optional: Toast or alert here
      }
    } catch (error) {
      console.error('Error verifying password:', error)
    } finally {
      setVerifying(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const [response] = await Promise.all([
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: data })
        }),
        // Guardar también los toggles de tareas (fotos aire, etc.)
        closuresRef.current?.saveBothTurnos?.() ?? Promise.resolve()
      ])

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
      methods.reset()
      console.log('Resetting...')
      loadSettings()
    }
  }

  if (!isUnlocked) {
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
            <div className="flex flex-1 flex-col overflow-hidden relative">
              {/* Blurred Skeleton Background */}
              <div className="absolute inset-0 z-0 p-8 space-y-8 filter blur-sm opacity-50 pointer-events-none overflow-hidden">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="grid gap-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>

              {/* Lock Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                <div className={`w-full max-w-sm p-8 bg-card border rounded-xl shadow-lg space-y-6 ${shake ? 'animate-shake' : ''}`}>
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Área Protegida</h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Esta sección contiene <strong>funciones avanzadas de desarrollador</strong> y configuraciones sensibles. Introduce tu contraseña de administrador para continuar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="unlock-password">Contraseña</Label>
                      <Input
                        id="unlock-password"
                        type="password"
                        placeholder="Contraseña de admin..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleUnlock}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        'Desbloquear'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminLayout>
    )
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
                        <ClosuresSettings ref={closuresRef} />
                        <WorkersSettings />
                        <SystemSettings />
                      </div>
                    )}

                  </form>
                </FormProvider>

                {/* Storage Monitor — fuera del form, no es un setting guardable */}
                <div className="mt-6">
                  <StorageMonitor />
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
