'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

const UNIDADES = ['und', 'kg', 'g', 'L', 'mL', 'botes', 'cajas', 'bolsas', 'paquetes']
const HORA_CIERRE = 20 * 60 + 30 // 20:30

function estaBloquado(isAdmin) {
    if (isAdmin) return false
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes() >= HORA_CIERRE
}

function initials(nombre) {
    return (nombre || '?').substring(0, 1).toUpperCase()
}

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'ahora'
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
    return `hace ${Math.floor(diff / 86400)}d`
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────────
function AddSheet({ onClose, onAdd, trabajadorId }) {
    const [nombre, setNombre] = useState('')
    const [cantidad, setCantidad] = useState('')
    const [unidad, setUnidad] = useState('und')
    const [urgente, setUrgente] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef(null)

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150) }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!nombre.trim()) return
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/lista-compras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim(), cantidad: cantidad || null, unidad, urgente, trabajadorId })
            })
            let data = {}
            try { data = await res.json() } catch (_) { }
            if (res.ok) {
                onAdd()
            } else {
                setError(data.error || `Error ${res.status}`)
                setSubmitting(false)
            }
        } catch {
            setError('Sin conexión')
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-end" onClick={onClose}>
            <div
                className="w-full bg-[#1c1c1e] rounded-t-3xl pb-safe"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-4">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                <div className="px-5 pb-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white">Nuevo ítem</h2>
                        <button onClick={onClose} className="text-[#0a84ff] text-base font-medium">Cancelar</button>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm mb-4">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Nombre */}
                        <div className="bg-white/8 rounded-2xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Producto</div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Leche, zumo, agua…"
                                className="w-full bg-transparent text-white text-base placeholder-white/20 focus:outline-none"
                            />
                        </div>

                        {/* Cantidad + Unidad */}
                        <div className="flex gap-3">
                            <div className="flex-1 rounded-2xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Cantidad</div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={cantidad}
                                    onChange={e => setCantidad(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-transparent text-white text-base placeholder-white/20 focus:outline-none"
                                />
                            </div>
                            <div className="flex-1 rounded-2xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Unidad</div>
                                <select
                                    value={unidad}
                                    onChange={e => setUnidad(e.target.value)}
                                    className="w-full bg-transparent text-white text-base focus:outline-none appearance-none"
                                >
                                    {UNIDADES.map(u => <option key={u} value={u} className="bg-[#2c2c2e]">{u}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Urgente toggle */}
                        <button
                            type="button"
                            onClick={() => setUrgente(!urgente)}
                            className="w-full flex items-center justify-between rounded-2xl px-4 py-4 transition-colors"
                            style={{ background: urgente ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.07)', border: urgente ? '1px solid rgba(255,59,48,0.4)' : '1px solid transparent' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{urgente ? '🔴' : '🟡'}</span>
                                <span className="text-white font-medium">{urgente ? 'Urgente' : 'Sin urgencia'}</span>
                            </div>
                            <div
                                className="w-12 h-7 rounded-full flex items-center px-0.5 transition-all duration-200"
                                style={{ background: urgente ? '#ff3b30' : 'rgba(255,255,255,0.2)' }}
                            >
                                <div
                                    className="w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200"
                                    style={{ transform: urgente ? 'translateX(20px)' : 'translateX(0)' }}
                                />
                            </div>
                        </button>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !nombre.trim()}
                            className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 disabled:opacity-40"
                            style={{ background: submitting ? '#34c759aa' : '#34c759' }}
                        >
                            {submitting ? 'Añadiendo…' : '＋ Añadir a la lista'}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

// ─── Item Row iOS style ────────────────────────────────────────────────────
function ItemRow({ item, userId, isAdmin, bloqueado, onToggle, onDelete }) {
    const esPropio = item.trabajadorId === userId
    const comprado = item.estado === 'comprado'
    const cantidadStr = item.cantidad != null ? `${item.cantidad} ${item.unidad || ''}`.trim() : item.unidad || ''
    const canDelete = (esPropio || isAdmin) && !bloqueado

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-200 ${comprado ? 'opacity-40' : ''}`}
        >
            {/* Circle checkbox — iOS Reminders style */}
            <button
                onClick={() => onToggle(item)}
                className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-90"
                style={{
                    borderColor: comprado ? '#34c759' : item.urgente ? '#ff3b30' : 'rgba(255,255,255,0.25)',
                    background: comprado ? '#34c759' : 'transparent'
                }}
            >
                {comprado && (
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {/* Avatar initial */}
            <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: esPropio ? '#0a84ff33' : '#8e8e9333', color: esPropio ? '#0a84ff' : '#aeaeb2' }}
                title={item.trabajador?.nombre}
            >
                {initials(item.trabajador?.nombre)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-[15px] ${comprado ? 'line-through text-white/30' : 'text-white'}`}>
                        {item.nombre}
                    </span>
                    {item.urgente && !comprado && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(255,59,48,0.2)', color: '#ff6b6b' }}>
                            URGENTE
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/30">
                    {cantidadStr && <span>{cantidadStr}</span>}
                    {cantidadStr && <span>·</span>}
                    <span>{item.trabajador?.nombre}</span>
                    <span>·</span>
                    <span>{timeAgo(item.creadoAt)}</span>
                </div>
            </div>

            {/* Delete */}
            {canDelete && (
                <button
                    onClick={() => onDelete(item.id)}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90"
                    style={{ background: 'rgba(255,59,48,0.12)' }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M2 10L10 2" stroke="#ff3b30" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            )}
        </div>
    )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function ListaCompras({ onClose }) {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'
    const bloqueado = estaBloquado(isAdmin)

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showSheet, setShowSheet] = useState(false)
    const [toast, setToast] = useState(null) // { msg, type }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 2500)
    }

    const loadItems = useCallback(async () => {
        try {
            const res = await fetch('/api/lista-compras')
            if (res.ok) setItems(await res.json())
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadItems() }, [loadItems])

    async function handleToggle(item) {
        const nuevo = item.estado === 'comprado' ? 'pendiente' : 'comprado'
        // Optimistic update
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, estado: nuevo } : i))
        try {
            await fetch(`/api/lista-compras/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevo })
            })
            if (nuevo === 'comprado') showToast('Marcado como comprado ✓')
        } catch { await loadItems() }
    }

    async function handleDelete(id) {
        setItems(prev => prev.filter(i => i.id !== id))
        try {
            await fetch(`/api/lista-compras/${id}`, { method: 'DELETE' })
            showToast('Ítem eliminado')
        } catch { await loadItems() }
    }

    async function handleLimpiar() {
        try {
            await fetch('/api/lista-compras', { method: 'DELETE' })
            showToast('Lista limpiada')
            await loadItems()
        } catch (e) { console.error(e) }
    }

    function handleAddSuccess() {
        setShowSheet(false)
        showToast('Añadido a la lista 🛒')
        loadItems()
    }

    const pendientes = items.filter(i => i.estado === 'pendiente')
    const urgentes = pendientes.filter(i => i.urgente)
    const comprados = items.filter(i => i.estado === 'comprado')

    return (
        <>
            <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#000' }}>
                {/* iOS-style navigation bar */}
                <div
                    className="flex-shrink-0 flex items-center justify-between px-5 pt-safe"
                    style={{
                        paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
                        paddingBottom: '12px',
                        background: 'rgba(28,28,30,0.95)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '0.5px solid rgba(255,255,255,0.08)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="text-[#0a84ff] text-base font-medium active:opacity-60 transition-opacity"
                    >
                        ‹ Volver
                    </button>
                    <h1 className="text-[17px] font-semibold text-white">Lista de Compras</h1>
                    {!bloqueado ? (
                        <button
                            onClick={() => setShowSheet(true)}
                            className="text-[#0a84ff] text-base font-medium active:opacity-60 transition-opacity"
                        >
                            ＋
                        </button>
                    ) : (
                        <div className="w-8" />
                    )}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto" style={{ background: '#000' }}>

                    {/* Time lock banner */}
                    {bloqueado && (
                        <div className="mx-4 mt-4 rounded-2xl px-4 py-3.5 flex items-center gap-3"
                            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.25)' }}>
                            <span className="text-xl flex-shrink-0">⏰</span>
                            <div>
                                <p className="text-[#ff6b6b] font-semibold text-sm">Lista cerrada</p>
                                <p className="text-[#ff6b6b]/70 text-xs mt-0.5">La edición se cerró a las 20:30</p>
                            </div>
                        </div>
                    )}

                    {/* KPI strip */}
                    {!loading && items.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
                            {[
                                { label: 'Pendientes', value: pendientes.length, color: '#0a84ff' },
                                { label: 'Urgentes', value: urgentes.length, color: '#ff3b30' },
                                { label: 'Comprados', value: comprados.length, color: '#34c759' },
                            ].map(k => (
                                <div key={k.label} className="rounded-2xl px-3 py-3 text-center"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
                                    <div className="text-[11px] text-white/40 mt-0.5">{k.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                            <div className="text-7xl mb-4">🛒</div>
                            <p className="text-white font-semibold text-lg mb-2">Lista vacía</p>
                            <p className="text-white/40 text-sm">Pulsa ＋ para añadir el primer producto</p>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="px-4 mt-4 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            ))}
                        </div>
                    )}

                    {/* Pendientes */}
                    {!loading && pendientes.length > 0 && (
                        <div className="mt-5 mx-4">
                            <p className="text-[13px] font-semibold text-white/30 uppercase tracking-widest mb-2 px-1">
                                Por comprar
                            </p>
                            <div className="rounded-2xl overflow-hidden divide-y divide-white/5"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                {pendientes.map(item => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        userId={user?.id}
                                        isAdmin={isAdmin}
                                        bloqueado={bloqueado}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comprados */}
                    {!loading && comprados.length > 0 && (
                        <div className="mt-5 mx-4 mb-4">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <p className="text-[13px] font-semibold text-white/30 uppercase tracking-widest">
                                    Comprado
                                </p>
                                {isAdmin && (
                                    <button
                                        onClick={handleLimpiar}
                                        className="text-[#ff3b30] text-sm font-medium active:opacity-60"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="rounded-2xl overflow-hidden divide-y divide-white/5"
                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                {comprados.map(item => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        userId={user?.id}
                                        isAdmin={isAdmin}
                                        bloqueado={bloqueado}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info footer */}
                    <div className="mx-4 mt-4 mb-8 rounded-2xl px-4 py-4"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-white/25 text-xs leading-relaxed space-y-1">
                            <span className="block">🔒 Edición cerrada a las 20:30</span>
                            <span className="block">🔴 Los ítems urgentes aparecen primero</span>
                            <span className="block">✓ Solo el admin puede marcar como comprado</span>
                        </p>
                    </div>

                    {/* Safe area bottom spacer */}
                    <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
                </div>
            </div>

            {/* Bottom Sheet */}
            {showSheet && (
                <AddSheet
                    onClose={() => setShowSheet(false)}
                    onAdd={handleAddSuccess}
                    trabajadorId={user?.id}
                />
            )}

            {/* Toast notification */}
            {toast && (
                <div
                    className="fixed top-6 left-1/2 z-[80] px-5 py-3 rounded-2xl text-sm font-medium text-white shadow-2xl"
                    style={{
                        transform: 'translateX(-50%)',
                        background: 'rgba(44,44,46,0.95)',
                        backdropFilter: 'blur(20px)',
                        animation: 'fadeInDown 0.2s ease'
                    }}
                >
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeInDown {
                    from { transform: translateX(-50%) translateY(-8px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    )
}
