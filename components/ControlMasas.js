'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ControlMasas({ onClose }) {
    const { user } = useAuth()
    const [lotesActivos, setLotesActivos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showNuevoLote, setShowNuevoLote] = useState(false)
    const [showFinalizarModal, setShowFinalizarModal] = useState(false)
    const [showTiposModal, setShowTiposModal] = useState(false)
    const [loteSeleccionado, setLoteSeleccionado] = useState(null)

    // Tipos de masa
    const [tipos, setTipos] = useState([])
    const [nuevoTipo, setNuevoTipo] = useState('')

    // Form states
    const [tipo, setTipo] = useState('')
    const [fechaElaboracion, setFechaElaboracion] = useState('')
    const [motivoFinalizacion, setMotivoFinalizacion] = useState('finalizado')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // KPIs
    const [kpis, setKpis] = useState({ total: 0, ok: 0, proximo: 0, caducado: 0 })

    useEffect(() => {
        loadTipos()
        loadLotesActivos()
        // Set default datetime to now
        const now = new Date()
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        setFechaElaboracion(localDateTime)
    }, [])

    useEffect(() => {
        calcularKPIs()
    }, [lotesActivos])

    const loadLotesActivos = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${window.location.origin}/api/masas`)
            if (response.ok) {
                const data = await response.json()
                setLotesActivos(data)
            }
        } catch (error) {
            console.error('Error al cargar lotes de masa:', error)
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
            const response = await fetch(`${window.location.origin}/api/masas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo,
                    fechaElaboracion: new Date(fechaElaboracion).toISOString(),
                    trabajadorId: user.id
                })
            })

            let data = {}
            try { data = await response.json() } catch (_) { }

            if (response.ok) {
                setSuccess(`Lote #${data.numero} creado exitosamente`)
                setTipo('')
                const now = new Date()
                const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)
                setFechaElaboracion(localDateTime)
                setShowNuevoLote(false)
                await loadLotesActivos()
            } else {
                setError(data.error || `Error del servidor (${response.status})`)
            }
        } catch (error) {
            setError('Sin conexión con el servidor. Comprueba tu red.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFinalizarLote = async () => {
        if (!loteSeleccionado) return
        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch(`${window.location.origin}/api/masas/${loteSeleccionado.id}`, {
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
        // Si lleva 2+ días → sugiere merma, si no → finalizado
        setMotivoFinalizacion(lote.diasTranscurridos >= 2 ? 'merma' : 'finalizado')
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
        if (!fechaElaboracion) return ''
        const elaboracion = new Date(fechaElaboracion)
        const limite = new Date(elaboracion)
        limite.setDate(limite.getDate() + 3)
        return formatFecha(limite)
    }

    // ─── Tipos CRUD ────────────────────────────────────────────

    const loadTipos = async () => {
        try {
            const response = await fetch(`${window.location.origin}/api/masas/tipos`)
            if (response.ok) {
                const data = await response.json()
                setTipos(data.map(t => t.nombre))
            }
        } catch (error) {
            console.error('Error al cargar tipos de masa:', error)
        }
    }

    const handleAgregarTipo = async () => {
        if (!nuevoTipo.trim()) return
        const tipoTrimmed = nuevoTipo.trim()
        if (tipos.includes(tipoTrimmed)) {
            setError('Este tipo ya existe')
            setTimeout(() => setError(''), 2000)
            return
        }

        try {
            const response = await fetch(`${window.location.origin}/api/masas/tipos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: tipoTrimmed })
            })

            if (response.ok) {
                await loadTipos()
                setNuevoTipo('')
                setSuccess('Tipo agregado correctamente')
                setTimeout(() => setSuccess(''), 2000)
            } else {
                const data = await response.json()
                setError(data.error || 'Error al agregar tipo')
                setTimeout(() => setError(''), 2000)
            }
        } catch (error) {
            setError('Error de conexión')
            setTimeout(() => setError(''), 2000)
        }
    }

    const handleEliminarTipo = async (tipoAEliminar) => {
        try {
            const response = await fetch(`${window.location.origin}/api/masas/tipos`)
            if (response.ok) {
                const allTipos = await response.json()
                const tipoToDelete = allTipos.find(t => t.nombre === tipoAEliminar)
                if (tipoToDelete) {
                    const deleteResponse = await fetch(
                        `${window.location.origin}/api/masas/tipos/${tipoToDelete.id}`,
                        { method: 'DELETE' }
                    )
                    if (deleteResponse.ok) {
                        await loadTipos()
                        setSuccess('Tipo eliminado correctamente')
                        setTimeout(() => setSuccess(''), 2000)
                    }
                }
            }
        } catch (error) {
            setError('Error al eliminar tipo')
            setTimeout(() => setError(''), 2000)
        }
    }

    const handleResetTipos = async () => {
        if (confirm('¿Estás seguro de que quieres eliminar todos los tipos de masa?')) {
            try {
                const response = await fetch(`${window.location.origin}/api/masas/tipos`, {
                    method: 'DELETE'
                })
                if (response.ok) {
                    await loadTipos()
                    setSuccess('Todos los tipos eliminados')
                    setTimeout(() => setSuccess(''), 2000)
                }
            } catch (error) {
                setError('Error al eliminar tipos')
                setTimeout(() => setError(''), 2000)
            }
        }
    }

    // ─── Render ────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 overflow-y-auto">
            <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 lg:p-8">
                <div className="w-full max-w-6xl bg-white/10 backdrop-blur-lg rounded-none sm:rounded-xl lg:rounded-2xl border-0 sm:border border-white/20 relative min-h-screen sm:min-h-0">

                    {/* Botón de cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6 pt-20 sm:pt-6 px-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4">
                            <span className="text-2xl sm:text-3xl">🧇</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                                Control de Masas – Waffle & Creps
                            </h1>
                            <button
                                onClick={() => setShowTiposModal(true)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                                title="Gestionar tipos de masa"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-white/70 text-sm sm:text-base">
                            Gestiona los lotes de masa en frío
                        </p>

                        {/* Botón Nuevo Lote */}
                        <button
                            onClick={() => setShowNuevoLote(!showNuevoLote)}
                            className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Nuevo Lote de Masa</h2>
                            <form onSubmit={handleCrearLote} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Tipo de Masa
                                    </label>
                                    {tipos.length === 0 ? (
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
                                            <p className="text-yellow-200 text-xs sm:text-sm">
                                                ⚠️ No hay tipos configurados. Haz clic en el icono ⚙️ arriba para agregar tipos.
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={tipo}
                                            onChange={(e) => setTipo(e.target.value)}
                                            className="w-full px-4 py-3 text-base bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            style={{ colorScheme: 'dark' }}
                                            required
                                        >
                                            <option value="" style={{ backgroundColor: '#1e293b' }}>Selecciona un tipo</option>
                                            {tipos.map(t => (
                                                <option key={t} value={t} style={{ backgroundColor: '#1e293b' }}>{t}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Fecha y Hora de Elaboración
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={fechaElaboracion}
                                        onChange={(e) => setFechaElaboracion(e.target.value)}
                                        className="w-full px-4 py-3 text-base bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        style={{ colorScheme: 'dark' }}
                                        required
                                    />
                                </div>

                                {fechaElaboracion && (
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                        <p className="text-blue-200 text-sm">
                                            📅 <strong>Fecha límite:</strong> {calcularFechaLimite()}
                                        </p>
                                        <p className="text-blue-200/70 text-xs mt-1">
                                            La masa debe retirarse antes de esta fecha
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !tipo || !fechaElaboracion || tipos.length === 0}
                                    className={`w-full px-6 py-4 sm:py-3 text-base rounded-lg font-bold transition-all duration-300 ${isSubmitting || !tipo || !fechaElaboracion || tipos.length === 0
                                        ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transform active:scale-95'
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
                            <div className="text-xs sm:text-sm text-green-300/70">✅ OK (Día 1)</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{kpis.proximo}</div>
                            <div className="text-xs sm:text-sm text-yellow-300/70">🟡 Usar hoy (Día 2)</div>
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
                                    <div className="text-4xl mb-2">🧇</div>
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
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className="text-white font-semibold text-base sm:text-lg truncate">{lote.tipo}</h3>
                                                            <span className="flex-shrink-0 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full tracking-wide">
                                                                #{lote.numero}
                                                            </span>
                                                        </div>
                                                        <p className="text-white/60 text-xs sm:text-sm">
                                                            Elaboración: {formatFecha(lote.fechaElaboracion)}
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
                                                        ⚠️ RETIRAR INMEDIATAMENTE – Masa caducada
                                                    </p>
                                                </div>
                                            )}
                                            {lote.estadoVisual === 'proximo' && (
                                                <div className="mt-2 bg-yellow-500/20 border border-yellow-500/50 rounded p-2.5">
                                                    <p className="text-yellow-200 text-xs font-semibold">
                                                        ⚠️ Último día – Usar o retirar hoy
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información / Reglas */}
                    <div className="mx-4 mb-4 pb-24 sm:pb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                        <h3 className="text-blue-200 font-semibold mb-2">📋 Reglas Importantes</h3>
                        <ul className="text-blue-200/80 text-sm space-y-1">
                            <li>• Máximo 3 días en frío</li>
                            <li>• Día 2: usar prioritariamente antes que masa nueva</li>
                            <li>• Día 3: retirar obligatoriamente</li>
                            <li>• Marcar físicamente el recipiente con el nº de lote</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal Gestionar Tipos */}
            {showTiposModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 sm:p-6 border border-white/20 w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white">Gestionar Tipos de Masa</h3>
                            <button
                                onClick={() => setShowTiposModal(false)}
                                className="w-9 h-9 sm:w-8 sm:h-8 bg-red-500/80 hover:bg-red-500 active:bg-red-600 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Agregar nuevo tipo */}
                        <div className="mb-5 sm:mb-6 bg-white/5 rounded-lg p-4">
                            <label className="block text-sm font-medium text-white/80 mb-3">
                                ➕ Agregar Nuevo Tipo
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nuevoTipo}
                                    onChange={(e) => setNuevoTipo(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAgregarTipo()}
                                    className="flex-1 min-w-0 px-3 sm:px-4 py-3 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ej: Waffle"
                                />
                                <button
                                    onClick={handleAgregarTipo}
                                    className="w-12 h-12 sm:w-auto sm:px-6 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white rounded-lg font-bold transition-all text-xl sm:text-base flex items-center justify-center flex-shrink-0"
                                    title="Agregar tipo"
                                >
                                    ➕
                                </button>
                            </div>
                        </div>

                        {/* Lista de tipos */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">
                                    📋 Tipos ({tipos.length})
                                </label>
                                {tipos.length > 0 && (
                                    <button
                                        onClick={handleResetTipos}
                                        className="text-xs text-red-300 hover:text-red-200 active:text-red-100 underline py-1"
                                    >
                                        Eliminar todos
                                    </button>
                                )}
                            </div>

                            {tipos.length === 0 ? (
                                <div className="text-center py-8 bg-white/5 rounded-lg">
                                    <div className="text-4xl mb-2">🧇</div>
                                    <p className="text-white/60 text-sm">No hay tipos configurados</p>
                                    <p className="text-white/40 text-xs mt-1">Agrega tu primer tipo arriba</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {tipos.map((t) => (
                                        <div
                                            key={t}
                                            className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-3.5 sm:p-3 rounded-lg border border-white/20 hover:bg-white/15 active:bg-white/20 transition-all"
                                        >
                                            <span className="text-white font-medium text-base truncate flex-1 mr-2">{t}</span>
                                            <button
                                                onClick={() => handleEliminarTipo(t)}
                                                className="text-red-400 hover:text-red-300 active:text-red-200 transition-colors p-2 -mr-1 flex-shrink-0"
                                                title="Eliminar tipo"
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
            {showFinalizarModal && loteSeleccionado && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 sm:p-6 border border-white/20 w-full max-w-md">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Finalizar Lote</h3>

                        <div className="mb-5 bg-white/5 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-amber-500 text-white font-black text-2xl w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                                    #{loteSeleccionado.numero}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-base">{loteSeleccionado.tipo}</p>
                                    <p className="text-white/60 text-xs">Elaboración: {formatFecha(loteSeleccionado.fechaElaboracion)}</p>
                                    <p className="text-white/60 text-xs">Días en frío: {loteSeleccionado.diasTranscurridos}</p>
                                </div>
                            </div>
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
                                <span className="text-white text-base sm:text-base">✅ Finalizado (masa agotada)</span>
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
                                <span className="text-white text-base sm:text-base">🔴 Merma (retirada en día 3)</span>
                            </label>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setShowFinalizarModal(false)
                                    setLoteSeleccionado(null)
                                }}
                                className="w-full sm:flex-1 px-4 py-3.5 sm:py-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-lg transition-all font-medium text-base"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleFinalizarLote}
                                disabled={isSubmitting}
                                className={`w-full sm:flex-1 px-4 py-3.5 sm:py-2 rounded-lg font-bold transition-all text-base ${isSubmitting
                                    ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 active:scale-95'
                                    }`}
                            >
                                {isSubmitting ? 'Finalizando...' : 'Finalizar Lote'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
