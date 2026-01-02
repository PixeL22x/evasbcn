'use client'

import { Home, Package, IceCream, Menu } from 'lucide-react'

export default function BottomNav({ onNavigate, currentView }) {
    const navItems = [
        {
            id: 'home',
            icon: Home,
            label: 'Inicio',
            color: 'text-blue-400'
        },
        {
            id: 'cierre',
            icon: '🚀',
            label: 'Cierre',
            highlight: true,
            color: 'text-purple-400'
        },
        {
            id: 'pedido',
            icon: IceCream,
            label: 'Pedido',
            color: 'text-pink-400'
        },
        {
            id: 'stock',
            icon: Package,
            label: 'Stock',
            color: 'text-indigo-400'
        },
        {
            id: 'more',
            icon: Menu,
            label: 'Más',
            color: 'text-white'
        }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-transparent backdrop-blur-xl border-t border-white/10" />

            {/* Safe Area Padding for iOS */}
            <div className="relative" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
                <div className="flex items-center justify-around px-2 py-3">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = currentView === item.id

                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`
                  relative flex flex-col items-center justify-center gap-1 
                  min-w-[64px] min-h-[48px] py-2 px-3 rounded-xl 
                  transition-all duration-300 active:scale-95
                  ${isActive
                                        ? item.color || 'text-purple-400'
                                        : 'text-white/60 hover:text-white/90'
                                    }
                  ${item.highlight && !isActive
                                        ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30'
                                        : ''
                                    }
                  ${item.highlight && isActive
                                        ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/50'
                                        : ''
                                    }
                  ${!item.highlight ? 'hover:bg-white/5' : ''}
                `}
                            >
                                {/* Active Indicator */}
                                {isActive && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                                )}

                                {/* Icon */}
                                <div className={`
                  ${item.highlight ? 'text-2xl' : ''}
                  ${isActive ? 'scale-110' : ''}
                  transition-transform duration-300
                `}>
                                    {typeof Icon === 'string' ? (
                                        <span className="text-2xl">{Icon}</span>
                                    ) : (
                                        <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`
                  text-[10px] font-medium tracking-tight
                  ${isActive ? 'font-semibold' : ''}
                `}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
