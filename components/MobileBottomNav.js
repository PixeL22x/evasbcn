"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Clock, Package, Thermometer, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { MoreMenuSheet } from './MoreMenuSheet'

export function MobileBottomNav() {
    const pathname = usePathname()
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

    const navItems = [
        {
            title: 'Cierres',
            icon: Clock,
            href: '/admin/cierres',
            isActive: pathname?.startsWith('/admin/cierres')
        },
        {
            title: 'Temperatura',
            icon: Thermometer,
            href: '/admin/temperatura',
            isActive: pathname?.startsWith('/admin/temperatura')
        },
        {
            title: 'Dashboard',
            icon: Home,
            href: '/admin/dashboard',
            isActive: pathname === '/admin/dashboard' || pathname === '/admin'
        },
        {
            title: 'Stocks',
            icon: Package,
            href: '/admin/stock',
            isActive: pathname?.startsWith('/admin/stock')
        }
    ]

    return (
        <>
            {/* Mobile Bottom Navigation - Only visible on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border shadow-lg">
                <div className="flex items-center justify-around h-16 px-2 pb-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200 active:scale-95 min-w-[64px]
                  ${item.isActive
                                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground scale-105 shadow-md'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }
                `}
                            >
                                <Icon className={`h-5 w-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                                <span className="text-[10px] font-medium leading-none">{item.title}</span>
                            </Link>
                        )
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className="
              relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
              transition-all duration-200 active:scale-95 min-w-[64px]
              text-muted-foreground hover:text-foreground hover:bg-accent
            "
                    >
                        <MoreHorizontal className="h-5 w-5 stroke-2" />
                        <span className="text-[10px] font-medium leading-none">Más</span>
                    </button>
                </div>
            </nav>

            {/* More Menu Sheet */}
            <MoreMenuSheet
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
            />
        </>
    )
}
