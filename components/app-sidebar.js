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
  IceCream
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
      title: "Trabajadores",
      url: "/admin/trabajadores",
      icon: Users,
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
                      <span>{item.title}</span>
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
