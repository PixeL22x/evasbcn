"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { BarcelonaTime } from "@/components/BarcelonaTime"
import { useAuth } from "../contexts/AuthContext"
import { Bell, Search, User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function SiteHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
  }
  return (
    <header className="sticky top-0 z-50 flex h-14 sm:h-16 shrink-0 items-center gap-2 bg-gradient-to-b from-background to-muted/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/50 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2 px-2 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-lg font-semibold tracking-tight">Panel Admin</h1>
          <BarcelonaTime />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
        {/* Ocultar botones de búsqueda y notificaciones en móvil */}
        <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-blue-500/10 active:bg-blue-500/20 rounded-lg">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-blue-500/10 active:bg-blue-500/20 rounded-lg">
          <Bell className="h-4 w-4" />
        </Button>
        <ModeToggle />

        {/* Información del usuario - más compacta en móvil */}
        {user && (
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-muted/50 rounded-full border border-border/50">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{user.name || user.username}</span>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">({user.role})</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Cerrar sesión"
          className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation hover:bg-red-500/10 active:bg-red-500/20 rounded-lg"
        >
          <LogOut className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </header>
  )
}
