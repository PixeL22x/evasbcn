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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-2 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-lg font-semibold">Panel Admin</h1>
          <BarcelonaTime />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
        {/* Ocultar botones de búsqueda y notificaciones en móvil */}
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-4 w-4" />
        </Button>
        <ModeToggle />
        
        {/* Información del usuario - más compacta en móvil */}
        {user && (
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-muted rounded-lg">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">{user.name || user.username}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">({user.role})</span>
          </div>
        )}
        
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión" className="h-8 w-8 sm:h-10 sm:w-10">
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </header>
  )
}
