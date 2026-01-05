'use client'

import { Home, Menu } from 'lucide-react'

export default function BottomNav({ onNavigate, currentView }) {
    const navItems = [
        {
            id: 'home',
            icon: Home,
            label: 'Inicio',
            color: 'text-blue-500',
            activeColor: 'bg-blue-50 text-blue-600'
        },
        {
            id: 'cierre',
            icon: '🚀',
            label: 'Cierre',
            highlight: true,
            color: 'text-purple-500',
            activeColor: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        },
        {
            id: 'more',
            icon: Menu,
            label: 'Más',
            color: 'text-gray-600',
            activeColor: 'bg-gray-100 text-gray-800'
        }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* White Background with Shadow */}
            <div className="bg-white border-t border-gray-200 shadow-lg">
                {/* Safe Area Padding for iOS */}
                <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
                    <div className="flex items-center justify-around px-2 py-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = currentView === item.id

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`
                                        relative flex flex-col items-center justify-center gap-1 
                                        min-w-[70px] py-2 px-3 rounded-2xl 
                                        transition-all duration-300 active:scale-95
                                        ${isActive && item.highlight
                                            ? item.activeColor + ' shadow-md'
                                            : isActive
                                                ? item.activeColor
                                                : 'hover:bg-gray-50'
                                        }
                                        ${!isActive ? item.color : ''}
                                    `}
                                >
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
            </div>
        </nav>
    )
}
