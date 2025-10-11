"use client"

import * as React from "react"
import {
  BarChart3,
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
  ClipboardList,
  Thermometer,
} from "lucide-react"
import { useSolicitudesCount } from "@/hooks/use-solicitudes-count"

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
  SidebarRail,
} from "@/components/ui/sidebar"

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
      items: [
        {
          title: "Historial",
          url: "/admin/cierres/historial",
        },
        {
          title: "Estadísticas",
          url: "/admin/cierres/estadisticas",
        },
      ],
    },
    {
      title: "Pedidos Helados",
      url: "/admin/pedidos-helados",
      icon: IceCream,
    },
    {
      title: "Control Stocks",
      url: "/admin/stock",
      icon: Package,
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
      title: "Reportes",
      url: "/admin/reportes",
      icon: FileText,
      items: [
        {
          title: "Ventas",
          url: "/admin/reportes/ventas",
        },
        {
          title: "Tareas",
          url: "/admin/reportes/tareas",
        },
      ],
    },
    {
      title: "Analíticas",
      url: "/admin/analytics",
      icon: TrendingUp,
    },
  ],
}

export function AppSidebar({ variant = "sidebar", ...props }) {
  const { count: solicitudesCount } = useSolicitudesCount()

  return (
    <Sidebar variant={variant} {...props}>
      <SidebarHeader>
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
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>
                      <item.icon />
                      <span>
                        {item.title}
                        {item.title === "Cambios de Turno" && solicitudesCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {solicitudesCount}
                          </span>
                        )}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
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
