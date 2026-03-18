'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function MoreMenuSheet({ onClose, onNavigate }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = 'unset' }
    }, [])

    const moreItems = [
        {
            id: 'pedido',
            icon: '🍦',
            label: 'Pedido Helados',
            description: 'Realizar pedido',
            color: 'from-pink-500/90 to-orange-500/90'
        },
        {
            id: 'stock',
            icon: '📦',
            label: 'Stock',
            description: 'Ver inventario',
            color: 'from-purple-500/90 to-indigo-500/90'
        },
        {
            id: 'temperatura',
            icon: '🌡️',
            label: 'Temperatura',
            description: 'Registrar vitrina',
            color: 'from-cyan-500/90 to-blue-500/90'
        },
        {
            id: 'tartas',
            icon: '🍰',
            label: 'Control Tartas',
            description: 'Lotes de tartas',
            color: 'from-rose-500/90 to-pink-500/90'
        },
        {
            id: 'masas',
            icon: '🧇',
            label: 'Control Masas',
            description: 'Waffle & Creps',
            color: 'from-amber-500/90 to-orange-500/90'
        },
        {
            id: 'lista-compras',
            icon: '🛒',
            label: 'Lista Compras',
            description: 'Lista del equipo',
            color: 'from-emerald-500/90 to-teal-500/90'
        },
        {
            id: 'resenas',
            icon: '⭐',
            label: 'Reseñas',
            description: 'Reseñas Google',
            color: 'from-yellow-500/90 to-orange-500/90'
        },
        {
            id: 'cambio-turno',
            icon: '🔄',
            label: 'Cambio Turno',
            description: 'Solicitar cambio',
            color: 'from-green-500/90 to-teal-500/90'
        }
    ]

    return (
        <div
            className="fixed inset-0 z-[100] md:hidden"
            onClick={onClose}
        >
            {/* Backdrop — sin blur para fluidez en Android */}
            <div className="absolute inset-0 bg-black/65 animate-fade-in" />

            {/* Bottom Sheet */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Más Opciones</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* 2-column grid — fits 8 items in 4 rows comfortably */}
                <div
                    className="grid grid-cols-2 gap-3 px-4 py-4"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
                >
                    {moreItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id)
                                onClose()
                            }}
                            className={`
                                flex items-center gap-3 p-3.5 rounded-2xl
                                bg-gradient-to-br ${item.color}
                                active:scale-95
                                transition-transform duration-150 shadow-md text-left
                            `}
                        >
                            <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0">
                                <span className="text-xl leading-none">{item.icon}</span>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-white leading-tight truncate">
                                    {item.label}
                                </div>
                                <div className="text-xs text-white/65 mt-0.5 leading-tight truncate">
                                    {item.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
