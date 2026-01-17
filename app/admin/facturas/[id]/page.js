'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import {
    ArrowLeft,
    Calendar,
    FileText,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Image as ImageIcon,
    MoreVertical,
    Tag,
    Building2,
    Download,
    Share2,
    X
} from 'lucide-react'

const CATEGORIAS = {
    helados: { label: 'Helados', color: 'text-purple-500', bg: 'bg-purple-500/10', emoji: '🍦' },
    ingredientes: { label: 'Ingredientes', color: 'text-green-500', bg: 'bg-green-500/10', emoji: '🥛' },
    packaging: { label: 'Packaging', color: 'text-blue-500', bg: 'bg-blue-500/10', emoji: '📦' },
    supermercado: { label: 'Supermercado', color: 'text-amber-500', bg: 'bg-amber-500/10', emoji: '🛒' },
    servicios: { label: 'Servicios', color: 'text-orange-500', bg: 'bg-orange-500/10', emoji: '⚡' },
    mantenimiento: { label: 'Mantenimiento', color: 'text-red-500', bg: 'bg-red-500/10', emoji: '🔧' },
    otros: { label: 'Otros', color: 'text-gray-500', bg: 'bg-gray-500/10', emoji: '📌' }
}

export default function FacturaDetallePage({ params }) {
    const router = useRouter()
    const [factura, setFactura] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showImage, setShowImage] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        cargarFactura()
    }, [])

    // Click outside para cerrar menú
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showMenu])

    const cargarFactura = async () => {
        try {
            const { id } = await params
            const response = await fetch(`/api/facturas/${id}`)
            if (response.ok) {
                const data = await response.json()
                setFactura(data.factura)
            }
        } catch (error) {
            console.error('Error al cargar factura:', error)
        } finally {
            setLoading(false)
        }
    }

    const marcarComoPagada = async () => {
        try {
            setProcessing(true)

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50)
            }

            const { id } = await params
            const response = await fetch(`/api/facturas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pagada: true,
                    fechaPago: new Date().toISOString()
                })
            })

            if (response.ok) {
                // Mostrar animación de éxito
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 2000)

                await cargarFactura()
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setProcessing(false)
        }
    }

    const eliminarFactura = async () => {
        if (!confirm('¿Estás seguro de eliminar esta factura?')) return

        try {
            setProcessing(true)
            const { id } = await params
            const response = await fetch(`/api/facturas/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                router.push('/admin/facturas')
            }
        } catch (error) {
            console.error('Error:', error)
            setProcessing(false)
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
            month: 'long',
            year: 'numeric'
        })
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-muted-foreground font-medium">Cargando factura...</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    if (!factura) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center px-4">
                        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Factura no encontrada</h3>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all font-semibold text-sm"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    const categoria = CATEGORIAS[factura.categoria] || CATEGORIAS.otros

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background pb-safe">
                {/* Header iOS Style */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/50"
                    style={{
                        boxShadow: '0 1px 0 0 rgba(0,0,0,0.05)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}>
                    <div className="safe-top">
                        <div className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 active:scale-95 transition-all font-semibold touch-manipulation -ml-2 px-2 py-1"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="text-sm sm:text-base">Facturas</span>
                                </button>
                                <div ref={menuRef} className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        disabled={processing}
                                        className="w-9 h-9 rounded-full hover:bg-muted/50 active:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 touch-manipulation"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-background rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                            style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false)
                                                    eliminarFactura()
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-3 transition-colors active:scale-95 touch-manipulation"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="text-sm font-semibold">Eliminar</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-32">
                    {/* Hero Section - Total Destacado */}
                    <div className="relative overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
                        <div className="relative p-6 sm:p-8">
                            <div className="text-center">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 ${categoria.color} ${categoria.bg}`}>
                                    <span className="text-base">{categoria.emoji}</span>
                                    <span>{categoria.label}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold mb-2">{factura.proveedorNombre}</h1>
                                {factura.proveedorNIF && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                                        <Tag className="w-4 h-4" />
                                        <span className="font-medium">{factura.proveedorNIF}</span>
                                    </div>
                                )}
                                <p className="text-sm font-semibold text-muted-foreground mb-2">
                                    Total de la Factura
                                </p>
                                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                    {formatCurrency(factura.total)}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${factura.pagada
                                        ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                        }`}>
                                        {factura.pagada ? '✓ Pagada' : '⏳ Pendiente'}
                                    </div>
                                </div>
                                {factura.pagada && factura.fechaPago && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Pagada el {formatDate(factura.fechaPago)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-background to-muted/20 border border-border/50"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <h2 className="text-sm font-bold text-muted-foreground mb-4">Información</h2>
                        <div className="grid grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Número</span>
                                </div>
                                <p className="font-bold text-sm sm:text-base">{factura.numero}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Fecha</span>
                                </div>
                                <p className="font-bold text-sm sm:text-base">{formatDate(factura.fecha)}</p>
                            </div>
                            {factura.fechaVencimiento && (
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Vencimiento</span>
                                    </div>
                                    <p className="font-bold text-sm sm:text-base">{formatDate(factura.fechaVencimiento)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Líneas de Factura */}
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground mb-3">Líneas de Factura ({factura.lineas.length})</h2>
                        <div className="space-y-2">
                            {factura.lineas.map((linea) => (
                                <div
                                    key={linea.id}
                                    className="p-4 rounded-2xl bg-muted/30 border border-border/30"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm mb-1 truncate">{linea.concepto}</p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {linea.cantidad} × {formatCurrency(linea.precioUnitario)}
                                            </p>
                                        </div>
                                        <p className="font-bold text-base">{formatCurrency(linea.total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desglose de Importes */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-background to-muted/20 border border-border/50"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <h2 className="text-sm font-bold text-muted-foreground mb-4">Desglose</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Subtotal</span>
                                <span className="font-bold">{formatCurrency(factura.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">IVA</span>
                                <span className="font-bold">{formatCurrency(factura.iva)}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Quick Actions - Sticky Bottom */}
                <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
                    <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 px-4 py-3"
                        style={{ boxShadow: '0 -1px 3px rgba(0,0,0,0.1)' }}>
                        <div className="max-w-3xl mx-auto flex gap-2">
                            {/* Botón principal - Marcar Pagada (solo si está pendiente) */}
                            {!factura.pagada && (
                                <button
                                    onClick={marcarComoPagada}
                                    disabled={processing}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold active:scale-95 transition-transform disabled:opacity-50 shadow-lg"
                                    style={{ boxShadow: '0 2px 8px rgba(34,197,94,0.25)' }}
                                >
                                    {processing ? 'Procesando...' : '✓ Marcar Pagada'}
                                </button>
                            )}

                            {/* Botón de Imagen - Más prominente cuando factura está pagada */}
                            <button
                                onClick={() => setShowImage(true)}
                                className={`${factura.pagada ? 'flex-1' : 'px-4'} py-3 bg-muted/50 hover:bg-muted rounded-full active:scale-95 transition-all flex items-center justify-center gap-2`}
                                title="Ver imagen original"
                            >
                                <ImageIcon className="w-5 h-5" />
                                {factura.pagada && <span className="font-semibold text-sm">Ver Imagen</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success Animation */}
                {showSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
                        <div className="bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6" />
                                <span className="font-bold">¡Factura marcada como pagada!</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Imagen - Mobile-First */}
                {showImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowImage(false)}
                    >
                        {/* Close Button - iOS Style */}
                        <button
                            onClick={() => setShowImage(false)}
                            className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all touch-manipulation"
                            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Image Container */}
                        <div
                            className="flex items-center justify-center h-full p-4 sm:p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={factura.imagenUrl}
                                alt="Factura"
                                className="max-w-full max-h-full rounded-2xl sm:rounded-3xl shadow-2xl object-contain animate-in zoom-in-95 duration-300"
                                onClick={() => setShowImage(false)}
                            />
                        </div>

                        {/* Hint Text - Mobile */}
                        <div className="fixed bottom-safe left-0 right-0 text-center pb-6 pointer-events-none">
                            <p className="text-white/60 text-sm font-medium">
                                Toca para cerrar
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
