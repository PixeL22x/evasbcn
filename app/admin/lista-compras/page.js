'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '../../../contexts/AuthContext'

const UNIDADES = ['und', 'kg', 'g', 'L', 'mL', 'botes', 'cajas', 'bolsas', 'paquetes']

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'ahora'
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function initials(nombre) {
    return (nombre || '?').substring(0, 1).toUpperCase()
}

// ─── Add form panel ─────────────────────────────────────────────────────────
function AddPanel({ user, onAdd, onCancel }) {
    const [nombre, setNombre] = useState('')
    const [cantidad, setCantidad] = useState('')
    const [unidad, setUnidad] = useState('und')
    const [urgente, setUrgente] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!nombre.trim() || !user?.id) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/lista-compras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim(), cantidad: cantidad || null, unidad, urgente, trabajadorId: user.id })
            })
            if (res.ok) onAdd()
        } finally { setSubmitting(false) }
    }

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <span className="text-emerald-500 text-lg">＋</span> Añadir ítem
                </h3>
                <button onClick={onCancel} className="text-muted-foreground hover:text-foreground text-sm transition-colors">Cancelar</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Producto *</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Leche, zumo, agua…"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Cantidad</label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={cantidad}
                            onChange={e => setCantidad(e.target.value)}
                            placeholder="2"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Unidad</label>
                        <select
                            value={unidad}
                            onChange={e => setUnidad(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        >
                            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setUrgente(!urgente)}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${urgente ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'border-border text-muted-foreground hover:border-red-300'}`}
                    >
                        <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all ${urgente ? 'bg-red-500' : 'bg-muted'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${urgente ? 'translate-x-4' : ''}`} />
                        </div>
                        {urgente ? '🔴 Urgente' : 'Sin urgencia'}
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !nombre.trim()}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
                    >
                        {submitting ? 'Añadiendo…' : 'Añadir a la lista'}
                    </button>
                </div>
            </form>
        </div>
    )
}

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({ item, onToggle, onDelete, optimisticToggling }) {
    const comprado = item.estado === 'comprado'
    const cantidadStr = item.cantidad != null ? `${item.cantidad} ${item.unidad || ''}`.trim() : item.unidad || ''
    const isToggling = optimisticToggling === item.id

    return (
        <div className={`group flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-muted/30 ${comprado ? 'opacity-50' : ''}`}>
            {/* Round checkbox */}
            <button
                onClick={() => onToggle(item)}
                disabled={isToggling}
                className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${comprado
                    ? 'bg-emerald-500 border-emerald-500'
                    : item.urgente
                        ? 'border-red-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'border-border hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
            >
                {comprado && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {/* Worker avatar */}
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                title={item.trabajador?.nombre}
            >
                {initials(item.trabajador?.nombre)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${comprado ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.nombre}
                    </span>
                    {item.urgente && !comprado && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            URGENTE
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {cantidadStr && <span className="font-medium">{cantidadStr}</span>}
                    {cantidadStr && <span className="opacity-40">·</span>}
                    <span>{item.trabajador?.nombre}</span>
                    <span className="opacity-40">·</span>
                    <span>{timeAgo(item.creadoAt)}</span>
                    {comprado && item.compradoAt && (
                        <>
                            <span className="opacity-40">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                ✓ {new Date(item.compradoAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Action: mark + delete */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {!comprado && (
                    <button
                        onClick={() => onToggle(item)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                        ✓ Comprado
                    </button>
                )}
                <button
                    onClick={() => onDelete(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2L12 12M2 12L12 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ListaComprasAdminPage() {
    const { user } = useAuth()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [optimisticToggling, setOptimisticToggling] = useState(null)
    const [toast, setToast] = useState(null)

    function showToast(msg, type = 'success') {
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
        setOptimisticToggling(item.id)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, estado: nuevo, compradoAt: nuevo === 'comprado' ? new Date().toISOString() : null } : i))
        try {
            await fetch(`/api/lista-compras/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevo })
            })
            if (nuevo === 'comprado') showToast('Marcado como comprado')
            else showToast('Devuelto a pendiente')
        } catch { loadItems() }
        finally { setOptimisticToggling(null) }
    }

    async function handleDelete(id) {
        setItems(prev => prev.filter(i => i.id !== id))
        try {
            await fetch(`/api/lista-compras/${id}`, { method: 'DELETE' })
            showToast('Ítem eliminado')
        } catch { loadItems() }
    }

    async function handleLimpiar() {
        if (!confirm('¿Limpiar todos los ítems comprados?')) return
        await fetch('/api/lista-compras', { method: 'DELETE' })
        showToast('Lista limpiada')
        loadItems()
    }

    async function handleAddSuccess() {
        setShowForm(false)
        showToast('Ítem añadido ✓')
        loadItems()
    }

    const pendientes = items.filter(i => i.estado === 'pendiente')
    const urgentes = pendientes.filter(i => i.urgente)
    const comprados = items.filter(i => i.estado === 'comprado')

    return (
        <AdminLayout>
            <SidebarProvider style={{ '--sidebar-width': '19rem', '--header-height': '4rem' }}>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <main className="flex-1 overflow-y-auto bg-background">
                            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

                                {/* Page header */}
                                <div className="flex items-start justify-between mb-6 gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold flex items-center gap-2">
                                            🛒 Lista de Compras
                                        </h1>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            Lista compartida del equipo
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {comprados.length > 0 && (
                                            <button
                                                onClick={handleLimpiar}
                                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M5 3V2h3v1M4 3v7a1 1 0 001 1h3a1 1 0 001-1V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                                Limpiar ({comprados.length})
                                            </button>
                                        )}
                                        <button
                                            onClick={loadItems}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11 6.5A4.5 4.5 0 012 6.5M2 6.5L4 4M2 6.5L4 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            Actualizar
                                        </button>
                                        <button
                                            onClick={() => setShowForm(!showForm)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${showForm ? 'bg-muted text-foreground' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                        >
                                            ＋ Añadir
                                        </button>
                                    </div>
                                </div>

                                {/* Add form */}
                                {showForm && (
                                    <AddPanel user={user} onAdd={handleAddSuccess} onCancel={() => setShowForm(false)} />
                                )}

                                {/* KPI cards */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[
                                        { label: 'Pendientes', value: pendientes.length, dot: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
                                        { label: 'Urgentes', value: urgentes.length, dot: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
                                        { label: 'Comprados', value: comprados.length, dot: '#22c55e', bg: 'rgba(34,197,94,0.06)' },
                                    ].map(k => (
                                        <div key={k.label} className="rounded-2xl border border-border px-4 py-4 text-center" style={{ background: k.bg }}>
                                            <div className="text-3xl font-bold tracking-tight" style={{ color: k.dot }}>{k.value}</div>
                                            <div className="text-xs text-muted-foreground mt-1 font-medium">{k.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Loading */}
                                {loading && (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 rounded-2xl border border-border animate-pulse bg-muted/30" />
                                        ))}
                                    </div>
                                )}

                                {/* Empty */}
                                {!loading && items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
                                        <div className="text-5xl mb-3">🛒</div>
                                        <p className="font-semibold text-foreground mb-1">Lista vacía</p>
                                        <p className="text-sm text-muted-foreground">Los trabajadores aún no han añadido ítems</p>
                                    </div>
                                )}

                                {/* Pendientes */}
                                {!loading && pendientes.length > 0 && (
                                    <div className="mb-5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                                            Por comprar · {pendientes.length}
                                        </p>
                                        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border bg-card">
                                            {pendientes.map(item => (
                                                <ItemRow
                                                    key={item.id}
                                                    item={item}
                                                    onToggle={handleToggle}
                                                    onDelete={handleDelete}
                                                    optimisticToggling={optimisticToggling}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Comprados */}
                                {!loading && comprados.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                                            Comprado · {comprados.length}
                                        </p>
                                        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border bg-card opacity-60">
                                            {comprados.map(item => (
                                                <ItemRow
                                                    key={item.id}
                                                    item={item}
                                                    onToggle={handleToggle}
                                                    onDelete={handleDelete}
                                                    optimisticToggling={optimisticToggling}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium text-white shadow-2xl"
                    style={{
                        transform: 'translateX(-50%)',
                        background: 'rgba(17,24,39,0.92)',
                        backdropFilter: 'blur(12px)',
                        animation: 'fadeUp 0.2s ease'
                    }}
                >
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { transform: translateX(-50%) translateY(8px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `}</style>
        </AdminLayout>
    )
}
