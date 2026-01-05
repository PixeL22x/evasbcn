'use client'

import { useState, useEffect } from 'react'

export default function WorkerDashboardWidgetsLight({ userId }) {
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
                setWidgets(prev => ({
                    ...prev,
                    temperatura: {
                        loaded: true,
                        data: { registrada: false, temperatura: null, hora: null }
                    }
                }))
            }
        } catch (error) {
            console.error('Error loading temperatura widget:', error)
            setWidgets(prev => ({
                ...prev,
                temperatura: {
                    loaded: true,
                    data: { registrada: false, temperatura: null, hora: null }
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

    return (
        <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                    📊 Estado de Hoy
                </h2>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${isRefreshing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-600 hover:bg-gray-50 active:scale-95 shadow-sm'
                        }`}
                >
                    <svg
                        className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
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
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Widget Temperatura */}
                <div className={`rounded-2xl p-4 transition-all shadow-sm ${!widgets.temperatura.loaded
                        ? 'bg-gray-100 animate-pulse'
                        : widgets.temperatura.data?.registrada
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
                            : 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200'
                    }`}>
                    <div className="text-center">
                        <div className="text-3xl mb-2">🌡️</div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Temp.</div>
                        {widgets.temperatura.loaded && widgets.temperatura.data ? (
                            widgets.temperatura.data.registrada ? (
                                <div className="text-xs font-bold text-green-600">✓ OK</div>
                            ) : (
                                <div className="text-xs font-bold text-yellow-600">Pendiente</div>
                            )
                        ) : (
                            <div className="text-xs text-gray-400">...</div>
                        )}
                    </div>
                </div>

                {/* Widget Tartas */}
                <div className={`rounded-2xl p-4 transition-all shadow-sm ${!widgets.tartas.loaded
                        ? 'bg-gray-100 animate-pulse'
                        : widgets.tartas.data?.caducados > 0
                            ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200'
                            : widgets.tartas.data?.proximos > 0
                                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200'
                                : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
                    }`}>
                    <div className="text-center">
                        <div className="text-3xl mb-2">🍰</div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Tartas</div>
                        {widgets.tartas.loaded && widgets.tartas.data ? (
                            widgets.tartas.data.requiereAtencion ? (
                                <div className="text-xs font-bold text-red-600">
                                    {widgets.tartas.data.caducados + widgets.tartas.data.proximos}!
                                </div>
                            ) : (
                                <div className="text-xs font-bold text-green-600">✓ OK</div>
                            )
                        ) : (
                            <div className="text-xs text-gray-400">...</div>
                        )}
                    </div>
                </div>

                {/* Widget Stock */}
                <div className={`rounded-2xl p-4 transition-all shadow-sm ${!widgets.stock.loaded
                        ? 'bg-gray-100 animate-pulse'
                        : widgets.stock.data?.requiereAtencion
                            ? 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200'
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
                    }`}>
                    <div className="text-center">
                        <div className="text-3xl mb-2">📦</div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Stock</div>
                        {widgets.stock.loaded && widgets.stock.data ? (
                            widgets.stock.data.requiereAtencion ? (
                                <div className="text-xs font-bold text-orange-600">{widgets.stock.data.bajoStock}!</div>
                            ) : (
                                <div className="text-xs font-bold text-green-600">✓ OK</div>
                            )
                        ) : (
                            <div className="text-xs text-gray-400">...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
