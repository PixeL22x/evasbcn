'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import {
    Receipt,
    Plus,
    Search,
    CheckCircle2,
    AlertCircle,
    Euro,
    Upload,
    Camera,
    X,
    ChevronDown,
    Sparkles,
    RefreshCw,
    Download
} from 'lucide-react'
import { exportarPDF } from '@/lib/pdfExport'

const CATEGORIAS = {
    todas: { label: 'Todas', color: 'text-gray-500', emoji: '📋' },
    helados: { label: 'Helados', color: 'text-purple-500', emoji: '🍦' },
    ingredientes: { label: 'Ingredientes', color: 'text-green-500', emoji: '🥛' },
    packaging: { label: 'Packaging', color: 'text-blue-500', emoji: '📦' },
    supermercado: { label: 'Supermercado', color: 'text-amber-500', emoji: '🛒' },
    servicios: { label: 'Servicios', color: 'text-orange-500', emoji: '⚡' },
    mantenimiento: { label: 'Mantenimiento', color: 'text-red-500', emoji: '🔧' },
    otros: { label: 'Otros', color: 'text-gray-500', emoji: '📌' }
}

export default function FacturasPage() {
    const router = useRouter()
    const [facturas, setFacturas] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showScanModal, setShowScanModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [exporting, setExporting] = useState(false)

    // Filtros
    const [mesActual] = useState(new Date().getMonth() + 1)
    const [añoActual] = useState(new Date().getFullYear())
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
    const [estadoFiltro, setEstadoFiltro] = useState('todas')
    const [busqueda, setBusqueda] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        cargarFacturas()
    }, [mesActual, añoActual, categoriaFiltro, estadoFiltro])

    const cargarFacturas = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            const params = new URLSearchParams({
                mes: mesActual,
                año: añoActual
            })

            if (categoriaFiltro !== 'todas') {
                params.append('categoria', categoriaFiltro)
            }

            if (estadoFiltro === 'pagadas') {
                params.append('pagada', 'true')
            } else if (estadoFiltro === 'pendientes') {
                params.append('pagada', 'false')
            }

            const response = await fetch(`/api/facturas?${params}`)
            if (response.ok) {
                const data = await response.json()
                setFacturas(data.facturas)
            }
        } catch (error) {
            console.error('Error al cargar facturas:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = useCallback(() => {
        cargarFacturas(true)
    }, [mesActual, añoActual, categoriaFiltro, estadoFiltro])

    const handleExportPDF = async () => {
        try {
            setExporting(true)
            await exportarPDF(facturas, mesActual, añoActual)
        } catch (error) {
            console.error('Error al exportar PDF:', error)
            alert('❌ Error al generar el PDF')
        } finally {
            setExporting(false)
        }
    }

    const handleFileUpload = async (file) => {
        if (!file) return

        try {
            setUploading(true)
            setUploadProgress(0)

            // Simular progreso
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            // 1. Subir a Cloudinary
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', 'facturas')

            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            )

            if (!uploadResponse.ok) {
                throw new Error('Error al subir imagen')
            }

            const uploadData = await uploadResponse.json()
            setUploadProgress(95)

            // 2. Enviar a API para análisis con IA
            const response = await fetch('/api/facturas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: uploadData.secure_url })
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (response.ok) {
                const data = await response.json()

                // Pequeño delay para mostrar el 100%
                setTimeout(() => {
                    setShowScanModal(false)
                    setUploading(false)
                    setUploadProgress(0)
                    router.push(`/admin/facturas/${data.factura.id}`)
                }, 500)
            } else {
                const error = await response.json()

                // Mostrar error específico según el tipo
                let errorMessage = '❌ Error al procesar la factura'

                if (error.type === 'AI_ANALYSIS_ERROR') {
                    errorMessage = '🤖 Error al analizar la factura con IA. Por favor, intenta con una imagen más clara.'
                } else if (error.type === 'DATABASE_ERROR') {
                    errorMessage = '💾 Error al guardar en base de datos. Por favor, intenta de nuevo.'
                } else if (error.details) {
                    errorMessage = `❌ Error: ${error.details}`
                }

                alert(errorMessage)
                setUploading(false)
                setUploadProgress(0)
            }

        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al procesar la factura')
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        })
    }

    // Calcular resumen
    const totalMes = facturas.reduce((sum, f) => sum + f.total, 0)
    const totalPendiente = facturas.filter(f => !f.pagada).reduce((sum, f) => sum + f.total, 0)
    const totalPagado = facturas.filter(f => f.pagada).reduce((sum, f) => sum + f.total, 0)
    const numPendientes = facturas.filter(f => !f.pagada).length

    // Filtrar por búsqueda
    const facturasFiltradas = facturas.filter(f =>
        f.proveedorNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.numero.toLowerCase().includes(busqueda.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background pb-safe">
                {/* Header iOS Style - Más compacto en mobile */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/50"
                    style={{
                        boxShadow: '0 1px 0 0 rgba(0,0,0,0.05)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}>
                    <div className="safe-top">
                        <div className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-between gap-3">
                                {/* Title Section */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">Facturas</h1>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                                            {new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', {
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                        className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted active:scale-95 flex items-center justify-center transition-all touch-manipulation"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={exporting || facturas.length === 0}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 active:scale-95 transition-all font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                        title="Exportar PDF"
                                    >
                                        <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
                                        <span className="hidden sm:inline">{exporting ? 'Generando...' : 'PDF'}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowScanModal(true)}
                                        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:shadow-2xl active:scale-95 transition-all font-bold text-sm sm:text-base shadow-lg hover:from-blue-600 hover:to-blue-700"
                                        style={{ boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}
                                    >
                                        <Plus className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={3} />
                                        <span className="hidden xs:inline">Escanear</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
                    {/* Resumen Cards - Mejorado para mobile */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {/* Total del Mes */}
                        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50"
                            style={{ boxShadow: '0 1px 3px rgba(59,130,246,0.1)' }}>
                            <div className="space-y-1 sm:space-y-2">
                                <div className="flex items-center gap-1">
                                    <Euro className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                                    <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-semibold">Total</p>
                                </div>
                                <p className="text-base sm:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                                    {formatCurrency(totalMes)}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-blue-500/70 font-medium">
                                    {facturas.length} facturas
                                </p>
                            </div>
                        </div>

                        {/* Pendientes */}
                        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50"
                            style={{ boxShadow: '0 1px 3px rgba(239,68,68,0.1)' }}>
                            <div className="space-y-1 sm:space-y-2">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                                    <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-semibold">Pendiente</p>
                                </div>
                                <p className="text-base sm:text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                                    {formatCurrency(totalPendiente)}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-red-500/70 font-medium">
                                    {numPendientes} sin pagar
                                </p>
                            </div>
                        </div>

                        {/* Pagadas */}
                        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/50"
                            style={{ boxShadow: '0 1px 3px rgba(34,197,94,0.1)' }}>
                            <div className="space-y-1 sm:space-y-2">
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                    <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-semibold">Pagado</p>
                                </div>
                                <p className="text-base sm:text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                                    {formatCurrency(totalPagado)}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-green-500/70 font-medium">
                                    {facturas.filter(f => f.pagada).length} completadas
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Búsqueda - iOS Style */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="w-4 h-4 text-muted-foreground/60" />
                        </div>
                        <input
                            type="search"
                            placeholder="Buscar facturas..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-border/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 text-sm placeholder:text-muted-foreground/50 transition-all"
                            style={{ WebkitAppearance: 'none' }}
                        />
                    </div>

                    {/* Filtros - Chips iOS Style */}
                    <div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-500 mb-3 active:scale-95 transition-transform touch-manipulation"
                        >
                            <span>Filtros</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {showFilters && (
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                {/* Estado */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {['todas', 'pendientes', 'pagadas'].map((estado) => (
                                        <button
                                            key={estado}
                                            onClick={() => setEstadoFiltro(estado)}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 touch-manipulation ${estadoFiltro === estado
                                                ? 'bg-blue-500 text-white shadow-sm'
                                                : 'bg-muted/50 text-muted-foreground border border-border/50'
                                                }`}
                                        >
                                            {estado === 'todas' ? 'Todas' : estado === 'pendientes' ? 'Pendientes' : 'Pagadas'}
                                        </button>
                                    ))}
                                </div>

                                {/* Categorías */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {Object.entries(CATEGORIAS).map(([key, cat]) => (
                                        <button
                                            key={key}
                                            onClick={() => setCategoriaFiltro(key)}
                                            className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 touch-manipulation flex items-center gap-1.5 ${categoriaFiltro === key
                                                ? `${cat.color} bg-current/10 border-2 border-current`
                                                : 'bg-muted/50 text-muted-foreground border border-border/50'
                                                }`}
                                        >
                                            <span>{cat.emoji}</span>
                                            <span>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Indicador de Cantidad - Sutil */}
                    {!loading && facturasFiltradas.length > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                            <span>
                                {facturasFiltradas.length === facturas.length
                                    ? `${facturasFiltradas.length} facturas`
                                    : `${facturasFiltradas.length} de ${facturas.length} facturas`}
                            </span>
                            {busqueda && (
                                <span className="text-blue-500">
                                    Filtrando por "{busqueda}"
                                </span>
                            )}
                        </div>
                    )}

                    {/* Lista de Facturas */}
                    {loading ? (
                        // Skeleton Loading iOS Style
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 rounded-2xl bg-muted/20 animate-pulse">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-muted/50 rounded w-20"></div>
                                            <div className="h-5 bg-muted/50 rounded w-32"></div>
                                            <div className="h-3 bg-muted/50 rounded w-24"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-6 bg-muted/50 rounded w-16"></div>
                                            <div className="h-5 bg-muted/50 rounded-full w-20"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : facturasFiltradas.length === 0 ? (
                        // Empty State iOS Style
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                <Receipt className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No hay facturas</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                {busqueda ? 'No se encontraron resultados' : 'Escanea tu primera factura para empezar'}
                            </p>
                            {!busqueda && (
                                <button
                                    onClick={() => setShowScanModal(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all font-semibold text-sm shadow-lg"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Escanear Factura</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {facturasFiltradas.map((factura) => {
                                const categoria = CATEGORIAS[factura.categoria] || CATEGORIAS.otros
                                return (
                                    <div
                                        key={factura.id}
                                        onClick={() => router.push(`/admin/facturas/${factura.id}`)}
                                        className="p-4 rounded-2xl bg-background/50 hover:bg-background active:bg-muted/30 transition-all cursor-pointer border border-border/30 active:scale-[0.98] touch-manipulation"
                                        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-base">{categoria.emoji}</span>
                                                    <span className={`text-[11px] font-bold ${categoria.color}`}>
                                                        {categoria.label}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">•</span>
                                                    <span className="text-[11px] text-muted-foreground font-medium truncate">
                                                        {factura.numero}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-base tracking-tight truncate mb-1">
                                                    {factura.proveedorNombre}
                                                </h3>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {formatDate(factura.fecha)}
                                                    {factura.fechaVencimiento && (
                                                        <> • Vence: {formatDate(factura.fechaVencimiento)}</>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-lg font-bold tracking-tight mb-1.5">
                                                    {formatCurrency(factura.total)}
                                                </p>
                                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${factura.pagada
                                                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                                    : 'bg-red-500/15 text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {factura.pagada ? (
                                                        <>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Pagada</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="w-3 h-3" />
                                                            <span>Pendiente</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Modal de Escaneo - Mejorado */}
                {showScanModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full sm:max-w-md bg-background rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300"
                            style={{ boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)' }}>
                            {/* Header */}
                            <div className="p-6 border-b border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold tracking-tight">Escanear Factura</h2>
                                    </div>
                                    <button
                                        onClick={() => !uploading && setShowScanModal(false)}
                                        disabled={uploading}
                                        className="w-9 h-9 rounded-full hover:bg-muted/50 active:bg-muted flex items-center justify-center transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 pb-24 max-h-[70vh] overflow-y-auto">
                                {uploading ? (
                                    <div className="text-center py-12">
                                        <div className="relative w-24 h-24 mx-auto mb-6">
                                            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                                            <div
                                                className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                                                style={{ animationDuration: '1s' }}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="text-base font-bold mb-2">Procesando factura...</p>
                                        <p className="text-sm text-muted-foreground mb-4">La IA está extrayendo los datos</p>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
                                    </div>
                                ) : (
                                    <>
                                        <label className="block cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e.target.files[0])}
                                                className="hidden"
                                            />
                                            <div className="border-2 border-dashed border-border/50 rounded-3xl p-12 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all active:scale-[0.98] touch-manipulation">
                                                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                                    <Upload className="w-8 h-8 text-blue-500" />
                                                </div>
                                                <p className="font-bold text-base mb-2">Subir Factura</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Toca para seleccionar una imagen
                                                </p>
                                            </div>
                                        </label>

                                        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 mb-4">
                                            <div className="flex items-start gap-3">
                                                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">
                                                        La IA extraerá automáticamente:
                                                    </p>
                                                    <ul className="text-xs text-blue-600/70 dark:text-blue-400/70 space-y-1">
                                                        <li>• Datos del proveedor y NIF</li>
                                                        <li>• Número y fecha de factura</li>
                                                        <li>• Productos y servicios</li>
                                                        <li>• Importes e IVA</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
