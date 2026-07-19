"use client"

import * as React from "react"
import {
  BarChart3,
  Bell,
  Calendar,
  Home,
  Settings,
  Users,
  FileText,
  TrendingUp,
  Clock,
  IceCream,
  RefreshCw,
  Package,
  PackageOpen,
  ClipboardList,
  Thermometer,
  Database,
  Bot,
  Star,
  ChevronRight,
  Receipt,
  ShoppingCart,
  Layers,
  ClipboardCheck,
  CalendarCheck,
  Tablet,
  Sun,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
      isActive: true,
    },
    {
      title: "Cierres",
      url: "/admin/cierres",
      icon: Clock,
    },
    {
      title: "Aperturas",
      url: "/admin/aperturas",
      icon: Sun,
    },
    {
      title: "Tickets del Día",
      url: "/admin/tickets",
      icon: FileText,
    },
    {
      title: "Facturas",
      url: "/admin/facturas",
      icon: Receipt,
    },
    {
      title: "Pedidos Helados",
      url: "/admin/pedidos-helados",
      icon: IceCream,
    },
    {
      title: "Lista de Compras",
      url: "/admin/lista-compras",
      icon: ShoppingCart,
    },
    {
      title: "Control Producción",
      url: "/admin/masas",
      icon: Layers,
    },
    {
      title: "Tareas Asignadas",
      url: "/admin/tareas",
      icon: ClipboardCheck,
    },
    {
      title: "Alarmas",
      url: "/admin/alarmas",
      icon: Bell,
    },
    {
      title: "Control Stocks",
      url: "/admin/stock",
      icon: Package,
    },
    {
      title: "Envases Inteligentes",
      url: "/admin/envases",
      icon: PackageOpen,
    },
    {
      title: "Inventario",
      url: "/admin/inventario",
      icon: ClipboardList,
    },
    {
      title: "Trabajadores",
      url: "/admin/trabajadores",
      icon: Users,
    },
    {
      title: "Cambios de Turno",
      url: "/admin/cambios-turno",
      icon: RefreshCw,
    },
    {
      title: "Horarios",
      url: "/admin/horarios",
      icon: Calendar,
    },
    {
      title: "Temperatura Vitrina",
      url: "/admin/temperatura",
      icon: Thermometer,
    },
    {
      title: "Reseñas",
      url: "/admin/resenas",
      icon: Star,
    },
    {
      title: "Reportes",
      url: "/admin/reportes",
      icon: BarChart3,
      items: [
        {
          title: "Fin de Mes",
          url: "/admin/reportes",
        },
        {
          title: "Asistencia",
          url: "/admin/reportes/asistencia",
        },
      ],
    },
    {
      title: "Fichajes",
      url: "/admin/fichajes",
      icon: Clock,
    },
    {
      title: "Analíticas",
      url: "/admin/analytics",
      icon: TrendingUp,
    },
    {
      title: "Backup",
      url: "/admin/backup",
      icon: Database,
    },
    {
      title: "Bots",
      url: "/admin/bots",
      icon: Bot,
    },
    {
      title: "TPV Auxiliar",
      url: "/admin/tpv",
      icon: Tablet,
    },
  ],
}

export function AppSidebar({ variant = "sidebar", ...props }) {
  return (
    <Sidebar variant={variant} {...props}>
      <SidebarHeader style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BarChart3 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Evas Barcelona</span>
            <span className="truncate text-xs">Panel Admin</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) =>
                item.items?.length ? (
                  <Collapsible key={item.title} asChild defaultOpen={false} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton asChild>
                                <a href={sub.url}>
                                  <span>{sub.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/admin/settings">
                <Settings />
                <span>Configuración</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
