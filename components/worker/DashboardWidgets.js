'use client'

import { useState, useEffect } from 'react'

export default function WorkerDashboardWidgets({ userId }) {
    const [widgets, setWidgets] = useState({
        temperatura: { loaded: false, data: null },
        tartas: { loaded: false, data: null },
        stock: { loaded: false, data: null }
    })
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Load on mount
    useEffect(() => {
        loadAllWidgets()
    }, [userId])

    // Refresh when returning to tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadAllWidgets()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    const loadAllWidgets = async () => {
        setIsRefreshing(true)
        await Promise.all([
            loadTemperaturaWidget(),
            loadTartasWidget(),
            loadStockWidget()
        ])
        setIsRefreshing(false)
    }

    const handleManualRefresh = () => {
        if (!isRefreshing) {
            loadAllWidgets()
        }
    }

    const loadTemperaturaWidget = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const response = await fetch(`${window.location.origin}/api/temperatura?fecha=${today}`)

            if (response.ok) {
                const data = await response.json()

                // Ensure data is an array
                const temperaturas = Array.isArray(data) ? data : (data.temperaturas || [])

                const hasToday = temperaturas.some(t => {
                    const tDate = new Date(t.fecha).toISOString().split('T')[0]
                    return tDate === today
                })

                const todayTemp = temperaturas.find(t => {
                    const tDate = new Date(t.fecha).toISOString().split('T')[0]
                    return tDate === today
                })

                setWidgets(prev => ({
                    ...prev,
                    temperatura: {
                        loaded: true,
                        data: {
                            registrada: hasToday,
                            temperatura: todayTemp?.temperatura,
                            hora: todayTemp?.fecha
                        }
                    }
                }))
            } else {
                // If API returns error, assume no temperature registered
                setWidgets(prev => ({
                    ...prev,
                    temperatura: {
                        loaded: true,
                        data: {
                            registrada: false,
                            temperatura: null,
                            hora: null
                        }
                    }
                }))
            }
        } catch (error) {
            console.error('Error loading temperatura widget:', error)
            setWidgets(prev => ({
                ...prev,
                temperatura: {
                    loaded: true,
                    data: {
                        registrada: false,
                        temperatura: null,
                        hora: null
                    }
                }
            }))
        }
    }

    const loadTartasWidget = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/tartas`)

            if (response.ok) {
                const lotes = await response.json()
                const caducados = lotes.filter(l => l.estadoVisual === 'caducado').length
                const proximos = lotes.filter(l => l.estadoVisual === 'proximo').length
                const total = lotes.length

                setWidgets(prev => ({
                    ...prev,
                    tartas: {
                        loaded: true,
                        data: {
                            total,
                            caducados,
                            proximos,
                            requiereAtencion: caducados > 0 || proximos > 0
                        }
                    }
                }))
            }
        } catch (error) {
            console.error('Error loading tartas widget:', error)
            setWidgets(prev => ({
                ...prev,
                tartas: { loaded: true, data: null }
            }))
        }
    }

    const loadStockWidget = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/stock`)

            if (response.ok) {
                const stocks = await response.json()
                const bajoStock = stocks.filter(s => {
                    const cantidad = s.cantidad || 0
                    const minimo = s.stockMinimo || 5
                    return cantidad <= minimo
                }).length

                setWidgets(prev => ({
                    ...prev,
                    stock: {
                        loaded: true,
                        data: {
                            bajoStock,
                            requiereAtencion: bajoStock > 0
                        }
                    }
                }))
            }
        } catch (error) {
            console.error('Error loading stock widget:', error)
            setWidgets(prev => ({
                ...prev,
                stock: { loaded: true, data: null }
            }))
        }
    }

    const formatHora = (fecha) => {
        if (!fecha) return ''
        const date = new Date(fecha)
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="space-y-3 px-4 md:px-0 mb-6">
            <div className="flex items-center justify-between">
                <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                    <span>📊</span>
                    Estado del Día
                </h2>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isRefreshing
                            ? 'bg-white/5 text-white/40 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-white/20 text-white/80 active:scale-95'
                        }`}
                    title="Actualizar datos"
                >
                    <svg
                        className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Widget Temperatura */}
                <div className={`rounded-2xl p-4 border-2 transition-all ${!widgets.temperatura.loaded
                    ? 'bg-white/5 border-white/10 animate-pulse'
                    : widgets.temperatura.data?.registrada
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl">🌡️</div>
                        {widgets.temperatura.loaded && (
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${widgets.temperatura.data?.registrada
                                ? 'bg-green-500/20 text-green-200'
                                : 'bg-yellow-500/20 text-yellow-200'
                                }`}>
                                {widgets.temperatura.data?.registrada ? '✓ OK' : '⚠ Pendiente'}
                            </div>
                        )}
                    </div>
                    <div className="text-white font-semibold text-sm mb-1">Temperatura</div>
                    {widgets.temperatura.loaded && widgets.temperatura.data ? (
                        widgets.temperatura.data.registrada ? (
                            <div className="text-white/70 text-xs">
                                {widgets.temperatura.data.temperatura}°C • {formatHora(widgets.temperatura.data.hora)}
                            </div>
                        ) : (
                            <div className="text-yellow-200 text-xs font-medium">
                                Sin registrar hoy
                            </div>
                        )
                    ) : (
                        <div className="text-white/40 text-xs">Cargando...</div>
                    )}
                </div>

                {/* Widget Tartas */}
                <div className={`rounded-2xl p-4 border-2 transition-all ${!widgets.tartas.loaded
                    ? 'bg-white/5 border-white/10 animate-pulse'
                    : widgets.tartas.data?.caducados > 0
                        ? 'bg-red-500/10 border-red-500/30'
                        : widgets.tartas.data?.proximos > 0
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-green-500/10 border-green-500/30'
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl">🍰</div>
                        {widgets.tartas.loaded && widgets.tartas.data && (
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${widgets.tartas.data.caducados > 0
                                ? 'bg-red-500/20 text-red-200'
                                : widgets.tartas.data.proximos > 0
                                    ? 'bg-yellow-500/20 text-yellow-200'
                                    : 'bg-green-500/20 text-green-200'
                                }`}>
                                {widgets.tartas.data.total} lotes
                            </div>
                        )}
                    </div>
                    <div className="text-white font-semibold text-sm mb-1">Control Tartas</div>
                    {widgets.tartas.loaded && widgets.tartas.data ? (
                        widgets.tartas.data.requiereAtencion ? (
                            <div className="space-y-1">
                                {widgets.tartas.data.caducados > 0 && (
                                    <div className="text-red-200 text-xs font-medium">
                                        🔴 {widgets.tartas.data.caducados} caducado{widgets.tartas.data.caducados > 1 ? 's' : ''}
                                    </div>
                                )}
                                {widgets.tartas.data.proximos > 0 && (
                                    <div className="text-yellow-200 text-xs font-medium">
                                        🟡 {widgets.tartas.data.proximos} próximo{widgets.tartas.data.proximos > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-green-200 text-xs font-medium">
                                ✓ Todo en orden
                            </div>
                        )
                    ) : (
                        <div className="text-white/40 text-xs">Cargando...</div>
                    )}
                </div>

                {/* Widget Stock */}
                <div className={`rounded-2xl p-4 border-2 transition-all ${!widgets.stock.loaded
                    ? 'bg-white/5 border-white/10 animate-pulse'
                    : widgets.stock.data?.requiereAtencion
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-green-500/10 border-green-500/30'
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl">📦</div>
                        {widgets.stock.loaded && widgets.stock.data && (
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${widgets.stock.data.requiereAtencion
                                ? 'bg-orange-500/20 text-orange-200'
                                : 'bg-green-500/20 text-green-200'
                                }`}>
                                {widgets.stock.data.requiereAtencion ? '⚠ Revisar' : '✓ OK'}
                            </div>
                        )}
                    </div>
                    <div className="text-white font-semibold text-sm mb-1">Stock</div>
                    {widgets.stock.loaded && widgets.stock.data ? (
                        widgets.stock.data.requiereAtencion ? (
                            <div className="text-orange-200 text-xs font-medium">
                                {widgets.stock.data.bajoStock} producto{widgets.stock.data.bajoStock > 1 ? 's' : ''} bajo{widgets.stock.data.bajoStock > 1 ? 's' : ''}
                            </div>
                        ) : (
                            <div className="text-green-200 text-xs font-medium">
                                ✓ Niveles normales
                            </div>
                        )
                    ) : (
                        <div className="text-white/40 text-xs">Cargando...</div>
                    )}
                </div>
            </div>
        </div>
    )
}
