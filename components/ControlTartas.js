'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const SABORES_DEFAULT = []

export default function ControlTartas({ onClose }) {
    const { user } = useAuth()
    const [lotesActivos, setLotesActivos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showNuevoLote, setShowNuevoLote] = useState(false)
    const [showFinalizarModal, setShowFinalizarModal] = useState(false)
    const [showSaboresModal, setShowSaboresModal] = useState(false)
    const [loteSeleccionado, setLoteSeleccionado] = useState(null)

    // Sabores management
    const [sabores, setSabores] = useState(SABORES_DEFAULT)
    const [nuevoSabor, setNuevoSabor] = useState('')

    // Form states
    const [sabor, setSabor] = useState('')
    const [fechaEntrada, setFechaEntrada] = useState('')
    const [motivoFinalizacion, setMotivoFinalizacion] = useState('finalizado')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // KPIs
    const [kpis, setKpis] = useState({
        total: 0,
        ok: 0,
        proximo: 0,
        caducado: 0
    })

    useEffect(() => {
        // Load sabores from database
        loadSabores()

        loadLotesActivos()

        // Set default datetime to now
        const now = new Date()
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        setFechaEntrada(localDateTime)
    }, [])

    useEffect(() => {
        calcularKPIs()
    }, [lotesActivos])

    const loadLotesActivos = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${window.location.origin}/api/tartas`)
            if (response.ok) {
                const data = await response.json()
                setLotesActivos(data)
            }
        } catch (error) {
            console.error('Error al cargar lotes:', error)
        } finally {
            setLoading(false)
        }
    }

    const calcularKPIs = () => {
        const total = lotesActivos.length
        const ok = lotesActivos.filter(l => l.estadoVisual === 'ok').length
        const proximo = lotesActivos.filter(l => l.estadoVisual === 'proximo').length
        const caducado = lotesActivos.filter(l => l.estadoVisual === 'caducado').length

        setKpis({ total, ok, proximo, caducado })
    }

    const handleCrearLote = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch(`${window.location.origin}/api/tartas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sabor,
                    fechaEntrada: new Date(fechaEntrada).toISOString(),
                    trabajadorId: user.id
                })
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess('Lote creado exitosamente')
                setSabor('')
                const now = new Date()
                const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)
                setFechaEntrada(localDateTime)
                setShowNuevoLote(false)
                await loadLotesActivos()
            } else {
                setError(data.error || 'Error al crear lote')
            }
        } catch (error) {
            setError('Error de conexión')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFinalizarLote = async () => {
        if (!loteSeleccionado) return

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch(`${window.location.origin}/api/tartas/${loteSeleccionado.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivoFinalizacion })
            })

            if (response.ok) {
                setSuccess('Lote finalizado exitosamente')
                setShowFinalizarModal(false)
                setLoteSeleccionado(null)
                await loadLotesActivos()
            } else {
                const data = await response.json()
                setError(data.error || 'Error al finalizar lote')
            }
        } catch (error) {
            setError('Error de conexión')
        } finally {
            setIsSubmitting(false)
        }
    }

    const openFinalizarModal = (lote) => {
        setLoteSeleccionado(lote)
        setMotivoFinalizacion(lote.diasTranscurridos >= 4 ? 'merma' : 'finalizado')
        setShowFinalizarModal(true)
    }

    const formatFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const calcularFechaLimite = () => {
        if (!fechaEntrada) return ''
        const entrada = new Date(fechaEntrada)
        const limite = new Date(entrada)
        limite.setDate(limite.getDate() + 4)
        return formatFecha(limite)
    }

    const loadSabores = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/tartas/sabores`)
            if (response.ok) {
                const data = await response.json()
                setSabores(data.map(s => s.nombre))
            }
        } catch (error) {
            console.error('Error al cargar sabores:', error)
        }
    }

    const handleAgregarSabor = async () => {
        if (!nuevoSabor.trim()) return

        const saborTrimmed = nuevoSabor.trim()
        if (sabores.includes(saborTrimmed)) {
            setError('Este sabor ya existe')
            setTimeout(() => setError(''), 2000)
            return
        }

        try {
            const response = await fetch(`${window.location.origin}/api/tartas/sabores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: saborTrimmed })
            })

            if (response.ok) {
                await loadSabores()
                setNuevoSabor('')
                setSuccess('Sabor agregado correctamente')
                setTimeout(() => setSuccess(''), 2000)
            } else {
                const data = await response.json()
                setError(data.error || 'Error al agregar sabor')
                setTimeout(() => setError(''), 2000)
            }
        } catch (error) {
            setError('Error de conexión')
            setTimeout(() => setError(''), 2000)
        }
    }

    const handleEliminarSabor = async (saborAEliminar) => {
        try {
            // Find the sabor ID from the loaded data
            const response = await fetch(`${window.location.origin}/api/tartas/sabores`)
            if (response.ok) {
                const allSabores = await response.json()
                const saborToDelete = allSabores.find(s => s.nombre === saborAEliminar)

                if (saborToDelete) {
                    const deleteResponse = await fetch(`${window.location.origin}/api/tartas/sabores/${saborToDelete.id}`, {
                        method: 'DELETE'
                    })

                    if (deleteResponse.ok) {
                        await loadSabores()
                        setSuccess('Sabor eliminado correctamente')
                        setTimeout(() => setSuccess(''), 2000)
                    }
                }
            }
        } catch (error) {
            setError('Error al eliminar sabor')
            setTimeout(() => setError(''), 2000)
        }
    }

    const handleResetSabores = async () => {
        if (confirm('¿Estás seguro de que quieres eliminar todos los sabores?')) {
            try {
                const response = await fetch(`${window.location.origin}/api/tartas/sabores`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    await loadSabores()
                    setSuccess('Todos los sabores eliminados')
                    setTimeout(() => setSuccess(''), 2000)
                }
            } catch (error) {
                setError('Error al eliminar sabores')
                setTimeout(() => setError(''), 2000)
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
            <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 lg:p-8">
                <div className="w-full max-w-6xl bg-white/10 backdrop-blur-lg rounded-none sm:rounded-xl lg:rounded-2xl border-0 sm:border border-white/20 relative min-h-screen sm:min-h-0">

                    {/* Botón de cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:top-4 sm:right-4 z-10 w-10 h-10 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6 pt-20 sm:pt-6 px-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4">
                            <span className="text-2xl sm:text-3xl">🍰</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                                Control de Tartas – Nevera Expositora
                            </h1>
                            <button
                                onClick={() => setShowSaboresModal(true)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                                title="Gestionar sabores"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-white/70 text-sm sm:text-base">
                            Gestiona los lotes de tartas en la nevera
                        </p>

                        {/* Botón Nuevo Lote */}
                        <button
                            onClick={() => setShowNuevoLote(!showNuevoLote)}
                            className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            {showNuevoLote ? '❌ Cancelar' : '➕ Nuevo Lote'}
                        </button>
                    </div>

                    {/* Mensajes */}
                    {error && (
                        <div className="mx-4 mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mx-4 mb-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                            <p className="text-green-200 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Formulario Nuevo Lote */}
                    {showNuevoLote && (
                        <div className="mx-4 mb-6 bg-white/5 rounded-lg p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Nuevo Lote</h2>
                            <form onSubmit={handleCrearLote} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Sabor de la Tarta
                                    </label>
                                    {sabores.length === 0 ? (
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
                                            <p className="text-yellow-200 text-xs sm:text-sm">
                                                ⚠️ No hay sabores configurados. Haz clic en el icono ⚙️ arriba para agregar sabores.
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={sabor}
                                            onChange={(e) => setSabor(e.target.value)}
                                            className="w-full px-4 py-3 sm:py-3 text-base bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            style={{ colorScheme: 'dark' }}
                                            required
                                        >
                                            <option value="" style={{ backgroundColor: '#1e293b' }}>Selecciona un sabor</option>
                                            {sabores.map(s => (
                                                <option key={s} value={s} style={{ backgroundColor: '#1e293b' }}>{s}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Fecha y Hora de Entrada
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={fechaEntrada}
                                        onChange={(e) => setFechaEntrada(e.target.value)}
                                        className="w-full px-4 py-3 sm:py-3 text-base bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        style={{ colorScheme: 'dark' }}
                                        required
                                    />
                                </div>

                                {fechaEntrada && (
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                        <p className="text-blue-200 text-sm">
                                            📅 <strong>Fecha límite:</strong> {calcularFechaLimite()}
                                        </p>
                                        <p className="text-blue-200/70 text-xs mt-1">
                                            El lote debe retirarse antes de esta fecha
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !sabor || !fechaEntrada || sabores.length === 0}
                                    className={`w-full px-6 py-4 sm:py-3 text-base sm:text-base rounded-lg font-bold transition-all duration-300 ${isSubmitting || !sabor || !fechaEntrada || sabores.length === 0
                                        ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transform active:scale-95'
                                        }`}
                                >
                                    {isSubmitting ? 'Creando...' : 'Crear Lote'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 mb-6">
                        <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                            <div className="text-2xl sm:text-3xl font-bold text-white">{kpis.total}</div>
                            <div className="text-xs sm:text-sm text-white/70">Total Activos</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
                            <div className="text-2xl sm:text-3xl font-bold text-green-400">{kpis.ok}</div>
                            <div className="text-xs sm:text-sm text-green-300/70">✅ OK (Día 1-2)</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{kpis.proximo}</div>
                            <div className="text-xs sm:text-sm text-yellow-300/70">🟡 Día 3</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4">
                            <div className="text-2xl sm:text-3xl font-bold text-red-400">{kpis.caducado}</div>
                            <div className="text-xs sm:text-sm text-red-300/70">🔴 Caducado</div>
                        </div>
                    </div>

                    {/* Lotes Activos */}
                    <div className="px-4 pb-6">
                        <div className="bg-white/5 rounded-lg p-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Lotes Activos</h2>

                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-white/60">Cargando...</p>
                                </div>
                            ) : lotesActivos.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🍰</div>
                                    <p className="text-white/60">No hay lotes activos</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lotesActivos.map((lote) => (
                                        <div
                                            key={lote.id}
                                            className={`bg-white/10 rounded-lg p-4 border-2 ${lote.estadoVisual === 'caducado'
                                                ? 'border-red-500/50 bg-red-500/10'
                                                : lote.estadoVisual === 'proximo'
                                                    ? 'border-yellow-500/50 bg-yellow-500/10'
                                                    : 'border-green-500/50'
                                                }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-2xl flex-shrink-0">{lote.icono}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-semibold text-base sm:text-lg truncate">{lote.sabor}</h3>
                                                        <p className="text-white/60 text-xs sm:text-sm">
                                                            Entrada: {formatFecha(lote.fechaEntrada)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openFinalizarModal(lote)}
                                                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all"
                                                >
                                                    Finalizar
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                                                <div className="bg-white/5 rounded-lg p-2">
                                                    <span className="text-white/60 block text-xs mb-1">Días transcurridos</span>
                                                    <span className="text-white font-semibold text-base">{lote.diasTranscurridos}</span>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2">
                                                    <span className="text-white/60 block text-xs mb-1">Días restantes</span>
                                                    <span className={`font-semibold text-base ${lote.diasRestantes === 0 ? 'text-red-400' :
                                                        lote.diasRestantes === 1 ? 'text-yellow-400' : 'text-green-400'
                                                        }`}>
                                                        {lote.diasRestantes}
                                                    </span>
                                                </div>
                                            </div>

                                            {lote.estadoVisual === 'caducado' && (
                                                <div className="mt-2 bg-red-500/20 border border-red-500/50 rounded p-2.5">
                                                    <p className="text-red-200 text-xs font-semibold">
                                                        ⚠️ RETIRAR INMEDIATAMENTE - Lote caducado
                                                    </p>
                                                </div>
                                            )}
                                            {lote.estadoVisual === 'proximo' && (
                                                <div className="mt-2 bg-yellow-500/20 border border-yellow-500/50 rounded p-2.5">
                                                    <p className="text-yellow-200 text-xs font-semibold">
                                                        ⚠️ Próximo a caducar - Retirar mañana
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información */}
                    <div className="mx-4 mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                        <h3 className="text-blue-200 font-semibold mb-2">📋 Reglas Importantes</h3>
                        <ul className="text-blue-200/80 text-sm space-y-1">
                            <li>• Máximo 4 días en nevera</li>
                            <li>• Nunca mezclar porciones de distintos días</li>
                            <li>• En día 4, retirar obligatoriamente</li>
                            <li>• Marcar físicamente el plato con la fecha</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal Gestionar Sabores */}
            {showSaboresModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 sm:p-6 border border-white/20 w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white">Gestionar Sabores</h3>
                            <button
                                onClick={() => setShowSaboresModal(false)}
                                className="w-9 h-9 sm:w-8 sm:h-8 bg-red-500/80 hover:bg-red-500 active:bg-red-600 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Agregar nuevo sabor */}
                        <div className="mb-5 sm:mb-6 bg-white/5 rounded-lg p-4">
                            <label className="block text-sm font-medium text-white/80 mb-3">
                                ➕ Agregar Nuevo Sabor
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nuevoSabor}
                                    onChange={(e) => setNuevoSabor(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAgregarSabor()}
                                    className="flex-1 min-w-0 px-3 sm:px-4 py-3 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej: Tiramisú"
                                />
                                <button
                                    onClick={handleAgregarSabor}
                                    className="w-12 h-12 sm:w-auto sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-95 text-white rounded-lg font-bold transition-all text-xl sm:text-base flex items-center justify-center flex-shrink-0"
                                    title="Agregar sabor"
                                >
                                    ➕
                                </button>
                            </div>
                        </div>

                        {/* Lista de sabores */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">
                                    📋 Sabores ({sabores.length})
                                </label>
                                {sabores.length > 0 && (
                                    <button
                                        onClick={handleResetSabores}
                                        className="text-xs text-red-300 hover:text-red-200 active:text-red-100 underline py-1"
                                    >
                                        Eliminar todos
                                    </button>
                                )}
                            </div>

                            {sabores.length === 0 ? (
                                <div className="text-center py-8 bg-white/5 rounded-lg">
                                    <div className="text-4xl mb-2">🍰</div>
                                    <p className="text-white/60 text-sm">No hay sabores configurados</p>
                                    <p className="text-white/40 text-xs mt-1">Agrega tu primer sabor arriba</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {sabores.map((s) => (
                                        <div
                                            key={s}
                                            className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-3.5 sm:p-3 rounded-lg border border-white/20 hover:bg-white/15 active:bg-white/20 transition-all"
                                        >
                                            <span className="text-white font-medium text-base sm:text-base truncate flex-1 mr-2">{s}</span>
                                            <button
                                                onClick={() => handleEliminarSabor(s)}
                                                className="text-red-400 hover:text-red-300 active:text-red-200 transition-colors p-2 -mr-1 flex-shrink-0"
                                                title="Eliminar sabor"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Finalizar Lote */}
            {
                showFinalizarModal && loteSeleccionado && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 sm:p-6 border border-white/20 w-full max-w-md">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Finalizar Lote</h3>

                            <div className="mb-5 bg-white/5 rounded-lg p-3 sm:p-4">
                                <p className="text-white/80 text-sm sm:text-base mb-1"><strong>Sabor:</strong> {loteSeleccionado.sabor}</p>
                                <p className="text-white/80 text-sm sm:text-base mb-1"><strong>Entrada:</strong> {formatFecha(loteSeleccionado.fechaEntrada)}</p>
                                <p className="text-white/80 text-sm sm:text-base"><strong>Días en nevera:</strong> {loteSeleccionado.diasTranscurridos}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <label className="flex items-center gap-3 bg-white/5 p-4 sm:p-3 rounded-lg cursor-pointer hover:bg-white/10 active:bg-white/15 transition-all border-2 border-transparent has-[:checked]:border-green-500/50">
                                    <input
                                        type="radio"
                                        name="motivo"
                                        value="finalizado"
                                        checked={motivoFinalizacion === 'finalizado'}
                                        onChange={(e) => setMotivoFinalizacion(e.target.value)}
                                        className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0"
                                    />
                                    <span className="text-white text-base sm:text-base">✅ Finalizado (plato vacío)</span>
                                </label>
                                <label className="flex items-center gap-3 bg-white/5 p-4 sm:p-3 rounded-lg cursor-pointer hover:bg-white/10 active:bg-white/15 transition-all border-2 border-transparent has-[:checked]:border-red-500/50">
                                    <input
                                        type="radio"
                                        name="motivo"
                                        value="merma"
                                        checked={motivoFinalizacion === 'merma'}
                                        onChange={(e) => setMotivoFinalizacion(e.target.value)}
                                        className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0"
                                    />
                                    <span className="text-white text-base sm:text-base">🔴 Merma (retirado en día 4)</span>
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowFinalizarModal(false)
                                        setLoteSeleccionado(null)
                                    }}
                                    className="w-full sm:flex-1 px-4 py-3.5 sm:py-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-lg transition-all font-medium text-base sm:text-base"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleFinalizarLote}
                                    disabled={isSubmitting}
                                    className={`w-full sm:flex-1 px-4 py-3.5 sm:py-2 rounded-lg font-bold transition-all text-base sm:text-base ${isSubmitting
                                        ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 active:scale-95'
                                        }`}
                                >
                                    {isSubmitting ? 'Finalizando...' : 'Finalizar Lote'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
