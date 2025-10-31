'use client'

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
import { Bot, MessageSquare, CloudRain, Bell, CheckCircle, Clock, Send, Settings } from "lucide-react"
import AdminLayout from '../../../components/AdminLayout'

export default function BotsPage() {
  const bots = [
    {
      id: 'telegram-ventas',
      name: 'Bot de Telegram - Ventas',
      description: 'Bot de Telegram para notificaciones de ventas y cierres',
      icon: MessageSquare,
      status: 'active',
      features: [
        'Notificaciones automáticas de cierres completados',
        'Envío de estadísticas de ventas',
        'Resumen de trabajador y turno',
      ],
      config: {
        botToken: 'Configurado',
        chatId: 'Configurado',
      },
    },
    {
      id: 'telegram-weather',
      name: 'Bot de Telegram - Alertas Meteorológicas',
      description: 'Bot para monitoreo meteorológico y alertas del toldo',
      icon: CloudRain,
      status: 'active',
      features: [
        'Monitoreo automático 2 veces al día (12:00, 18:00)',
        'Alertas cuando hay viento fuerte (≥28 km/h)',
        'Alertas cuando hay ráfagas (≥30 km/h)',
        'Alertas cuando llueve (≥1.0 mm/h)',
        'Historial guardado en Telegram',
      ],
      config: {
        weatherChatId: 'Configurado',
        api: 'Open-Meteo (gratis, sin API key)',
        ubicacion: 'Barcelona (41.3851, 2.1734)',
        cronJobs: '2 veces al día (12:00, 18:00)',
      },
    },
  ]

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
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bots</h1>
                    <p className="text-muted-foreground mt-2">
                      Información sobre los bots configurados en el sistema
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {bots.map((bot) => {
                      const Icon = bot.icon
                      const isActive = bot.status === 'active'
                      
                      return (
                        <Card key={bot.id} className="relative">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                  <Icon className={`h-6 w-6 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                  <CardTitle className="text-xl">{bot.name}</CardTitle>
                                  <CardDescription className="mt-1">
                                    {bot.description}
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge variant={isActive ? 'default' : 'secondary'}>
                                {isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Activo
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Inactivo
                                  </>
                                )}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Bell className="h-4 w-4" />
                                  Funcionalidades
                                </h3>
                                <ul className="space-y-2">
                                  {bot.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="pt-4 border-t">
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  Configuración
                                </h3>
                                <div className="space-y-2 text-sm">
                                  {Object.entries(bot.config).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-muted-foreground capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                      </span>
                                      <span className="font-medium">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Información General
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                          Los bots de Telegram permiten recibir notificaciones automáticas sobre eventos importantes del negocio.
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Send className="h-4 w-4" />
                          <span>Todos los mensajes se envían a grupos específicos de Telegram configurados</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>Los bots funcionan de forma automática una vez configurados</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>El bot meteorológico se ejecuta automáticamente 2 veces al día (12:00, 18:00) mediante cron jobs</span>
                        </div>
                      </div>
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

