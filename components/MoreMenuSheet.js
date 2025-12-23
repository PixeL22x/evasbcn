"use client"

import {
    Users,
    RefreshCw,
    Calendar,
    IceCream,
    ClipboardList,
    Star,
    FileText,
    TrendingUp,
    Database,
    Bot,
    Settings
} from 'lucide-react'
import Link from 'next/link'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { useSolicitudesCount } from '@/hooks/use-solicitudes-count'

export function MoreMenuSheet({ isOpen, onClose }) {
    const { count: solicitudesCount } = useSolicitudesCount()

    const menuItems = [
        {
            title: 'Trabajadores',
            description: 'Gestión de empleados',
            icon: Users,
            href: '/admin/trabajadores',
            gradient: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Cambios de Turno',
            description: 'Solicitudes pendientes',
            icon: RefreshCw,
            href: '/admin/cambios-turno',
            gradient: 'from-purple-500 to-purple-600',
            badge: solicitudesCount > 0 ? solicitudesCount : null
        },
        {
            title: 'Horarios',
            description: 'Planificación semanal',
            icon: Calendar,
            href: '/admin/horarios',
            gradient: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Pedidos Helados',
            description: 'Gestión de pedidos',
            icon: IceCream,
            href: '/admin/pedidos-helados',
            gradient: 'from-green-500 to-green-600'
        },
        {
            title: 'Inventario',
            description: 'Control de stock',
            icon: ClipboardList,
            href: '/admin/inventario',
            gradient: 'from-green-500 to-green-600'
        },
        {
            title: 'Reseñas',
            description: 'Opiniones de clientes',
            icon: Star,
            href: '/admin/resenas',
            gradient: 'from-pink-500 to-pink-600'
        },
        {
            title: 'Reportes',
            description: 'Informes y análisis',
            icon: FileText,
            href: '/admin/reportes',
            gradient: 'from-pink-500 to-pink-600'
        },
        {
            title: 'Analíticas',
            description: 'Métricas detalladas',
            icon: TrendingUp,
            href: '/admin/analytics',
            gradient: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Backup',
            description: 'Copias de seguridad',
            icon: Database,
            href: '/admin/backup',
            gradient: 'from-gray-500 to-gray-600'
        },
        {
            title: 'Bots',
            description: 'Automatizaciones',
            icon: Bot,
            href: '/admin/bots',
            gradient: 'from-gray-500 to-gray-600'
        },
        {
            title: 'Configuración',
            description: 'Ajustes del sistema',
            icon: Settings,
            href: '/admin/settings',
            gradient: 'from-gray-500 to-gray-600'
        }
    ]

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-3xl p-0 overflow-hidden"
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <SheetHeader className="px-6 pt-6 pb-4 border-b">
                        <SheetTitle className="text-left">Más opciones</SheetTitle>
                        <SheetDescription className="text-left">
                            Accede a todas las funciones del panel
                        </SheetDescription>
                    </SheetHeader>

                    {/* Menu Grid */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="grid grid-cols-2 gap-3 pb-safe">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className="group relative"
                                    >
                                        <div className={`
                      relative overflow-hidden rounded-2xl p-4 h-28
                      bg-gradient-to-br ${item.gradient}
                      transition-all duration-200
                      active:scale-95 hover:scale-[1.02]
                      shadow-md hover:shadow-lg
                    `}>
                                            {/* Icon */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                                    <Icon className="h-5 w-5 text-white" />
                                                </div>

                                                {/* Badge */}
                                                {item.badge && (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="space-y-0.5">
                                                <h3 className="text-sm font-semibold text-white leading-tight">
                                                    {item.title}
                                                </h3>
                                                <p className="text-[10px] text-white/80 leading-tight">
                                                    {item.description}
                                                </p>
                                            </div>

                                            {/* Shine effect on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
