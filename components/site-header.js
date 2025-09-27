"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
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
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Panel de Administración</h1>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2 px-4">
        <Button variant="ghost" size="icon">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <ModeToggle />
        
        {/* Información del usuario */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{user.name || user.username}</span>
            <span className="text-xs text-muted-foreground">({user.role})</span>
          </div>
        )}
        
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
