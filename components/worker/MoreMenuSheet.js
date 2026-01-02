'use client'

import { RefreshCw, Thermometer, Star, X } from 'lucide-react'
import { useEffect } from 'react'

export default function MoreMenuSheet({ onClose, onNavigate }) {
    // Prevenir scroll del body cuando está abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    const moreItems = [
        {
            id: 'cambio-turno',
            icon: RefreshCw,
            label: 'Cambio de Turno',
            description: 'Solicitar cambio o cubrir turno',
            color: 'from-green-500 to-teal-500'
        },
        {
            id: 'temperatura',
            icon: Thermometer,
            label: 'Temperatura Vitrina',
            description: 'Registrar temperatura',
            color: 'from-cyan-500 to-blue-500'
        },
        {
            id: 'resenas',
            icon: Star,
            label: 'Registrar Reseña',
            description: 'Reseñas de Google',
            color: 'from-yellow-500 to-orange-500'
        }
    ]

    return (
        <div
            className="fixed inset-0 z-[100] md:hidden"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Bottom Sheet */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">Más Opciones</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white/60" />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="px-4 py-6 space-y-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
                    {moreItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id)
                                    onClose()
                                }}
                                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl
                  bg-gradient-to-br ${item.color}
                  hover:scale-[1.02] active:scale-95
                  transition-all duration-300 shadow-lg
                `}
                            >
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-lg font-semibold text-white">
                                        {item.label}
                                    </div>
                                    <div className="text-sm text-white/70">
                                        {item.description}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
