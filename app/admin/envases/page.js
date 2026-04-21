'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertTriangle,
    Package,
    Plus,
    Trash2,
    Edit2,
    RefreshCw,
    TrendingUp,
    Box,
    Layers,
    ChevronDown,
    ChevronUp,
    Check,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ─── CATEGORÍAS ─────────────────────────────────────────────────────────────
const CATEGORIAS_ENVASE = ['vasos', 'tapas', 'pajitas', 'cubiertos', 'bolsas', 'cajas', 'servilletas', 'otros']
const MATCH_TYPES = [
    { value: 'contains', label: 'Contiene' },
    { value: 'startsWith', label: 'Empieza por' },
    { value: 'exact', label: 'Exacto' },
]

const CAT_COLORS = {
    vasos: 'bg-blue-100 text-blue-800',
    tapas: 'bg-purple-100 text-purple-800',
    pajitas: 'bg-pink-100 text-pink-800',
    cubiertos: 'bg-yellow-100 text-yellow-800',
    bolsas: 'bg-orange-100 text-orange-800',
    cajas: 'bg-green-100 text-green-800',
    servilletas: 'bg-gray-100 text-gray-800',
    otros: 'bg-slate-100 text-slate-800',
}

// ─── RECETAS INICIALES (pre-cargadas) ───────────────────────────────────────
// Se usan solo en el seed manual desde el tab de recetas

export default function EnvasesPage() {
    // ── State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('dashboard')

    // Datos
    const [envases, setEnvases] = useState([])
    const [recetas, setRecetas] = useState([])
    const [consumo, setConsumo] = useState(null)
    const [loading, setLoading] = useState({ envases: false, recetas: false, consumo: false })

    // Filtros dashboard
    const today = format(new Date(), 'yyyy-MM-dd')
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const [from, setFrom] = useState(thirtyDaysAgo)
    const [to, setTo] = useState(today)

    // Dialog: nuevo/editar envase
    const [envaseDialog, setEnvaseDialog] = useState(false)
    const [editingEnvase, setEditingEnvase] = useState(null)
    const [envaseForm, setEnvaseForm] = useState({ nombre: '', categoria: 'vasos', stockActual: 0, stockMinimo: 50, unidad: 'ud' })

    // Dialog: nuevo/editar receta
    const [recetaDialog, setRecetaDialog] = useState(false)
    const [editingReceta, setEditingReceta] = useState(null)
    const [recetaForm, setRecetaForm] = useState({ productoNombre: '', matchType: 'contains', envaseId: '', cantidad: 1 })

    // Stock adjustment
    const [adjustDialog, setAdjustDialog] = useState(false)
    const [adjustEnvase, setAdjustEnvase] = useState(null)
    const [adjustValue, setAdjustValue] = useState(0)
    const [adjustMode, setAdjustMode] = useState('set') // 'set' | 'add' | 'subtract'

    // Expanded rows in consumo table
    const [expandedConsumo, setExpandedConsumo] = useState(null)

    // ── Fetchers ───────────────────────────────────────────────────────────
    const fetchEnvases = useCallback(async () => {
        setLoading(p => ({ ...p, envases: true }))
        try {
            const res = await fetch('/api/envases')
            const data = await res.json()
            setEnvases(data.envases || [])
        } catch (e) { console.error(e) }
        finally { setLoading(p => ({ ...p, envases: false })) }
    }, [])

    const fetchRecetas = useCallback(async () => {
        setLoading(p => ({ ...p, recetas: true }))
        try {
            const res = await fetch('/api/envases/recetas')
            const data = await res.json()
            setRecetas(data.recetas || [])
        } catch (e) { console.error(e) }
        finally { setLoading(p => ({ ...p, recetas: false })) }
    }, [])

    const fetchConsumo = useCallback(async () => {
        setLoading(p => ({ ...p, consumo: true }))
        try {
            const res = await fetch(`/api/envases/consumo?from=${from}&to=${to}`)
            const data = await res.json()
            setConsumo(data)
        } catch (e) { console.error(e) }
        finally { setLoading(p => ({ ...p, consumo: false })) }
    }, [from, to])

    useEffect(() => {
        fetchEnvases()
        fetchRecetas()
    }, [fetchEnvases, fetchRecetas])

    useEffect(() => {
        if (activeTab === 'dashboard') fetchConsumo()
    }, [activeTab, fetchConsumo])

    // ── Envase handlers ────────────────────────────────────────────────────
    const openNewEnvase = () => {
        setEditingEnvase(null)
        setEnvaseForm({ nombre: '', categoria: 'vasos', stockActual: 0, stockMinimo: 50, unidad: 'ud' })
        setEnvaseDialog(true)
    }

    const openEditEnvase = (env) => {
        setEditingEnvase(env)
        setEnvaseForm({ nombre: env.nombre, categoria: env.categoria, stockActual: env.stockActual, stockMinimo: env.stockMinimo, unidad: env.unidad })
        setEnvaseDialog(true)
    }

    const saveEnvase = async () => {
        try {
            const url = editingEnvase ? `/api/envases/${editingEnvase.id}` : '/api/envases'
            const method = editingEnvase ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(envaseForm),
            })
            const data = await res.json()
            if (!res.ok) { alert(data.error || 'Error al guardar'); return }
            setEnvaseDialog(false)
            fetchEnvases()
        } catch (e) { console.error(e); alert('Error de conexión') }
    }

    const deleteEnvase = async (id) => {
        if (!confirm('¿Eliminar este envase y todas sus recetas?')) return
        await fetch(`/api/envases/${id}`, { method: 'DELETE' })
        fetchEnvases()
        fetchRecetas()
    }

    // Stock adjustment
    const openAdjust = (env) => {
        setAdjustEnvase(env)
        setAdjustValue(env.stockActual)
        setAdjustMode('set')
        setAdjustDialog(true)
    }

    const saveAdjust = async () => {
        const val = parseInt(adjustValue)
        if (isNaN(val) || val < 0) { alert('Introduce un número válido'); return }
        let newStock
        if (adjustMode === 'set') newStock = val
        else if (adjustMode === 'add') newStock = adjustEnvase.stockActual + val
        else newStock = Math.max(0, adjustEnvase.stockActual - val)

        const res = await fetch(`/api/envases/${adjustEnvase.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockActual: newStock }),
        })
        if (!res.ok) { alert('Error al actualizar stock'); return }
        setAdjustDialog(false)
        fetchEnvases()
        if (activeTab === 'dashboard') fetchConsumo()
    }

    // ── Receta handlers ────────────────────────────────────────────────────
    const openNewReceta = () => {
        setEditingReceta(null)
        setRecetaForm({ productoNombre: '', matchType: 'contains', envaseId: envases[0]?.id || '', cantidad: 1 })
        setRecetaDialog(true)
    }

    const openEditReceta = (r) => {
        setEditingReceta(r)
        setRecetaForm({ productoNombre: r.productoNombre, matchType: r.matchType, envaseId: r.envaseId, cantidad: r.cantidad })
        setRecetaDialog(true)
    }

    const saveReceta = async () => {
        try {
            const url = '/api/envases/recetas'
            const method = editingReceta ? 'PUT' : 'POST'
            const body = editingReceta ? { id: editingReceta.id, ...recetaForm } : recetaForm
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) { alert(data.error || 'Error al guardar receta'); return }
            setRecetaDialog(false)
            fetchRecetas()
        } catch (e) { console.error(e); alert('Error de conexión') }
    }

    const deleteReceta = async (id) => {
        if (!confirm('¿Eliminar esta receta?')) return
        await fetch('/api/envases/recetas', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        fetchRecetas()
    }

    // ── Helpers UI ─────────────────────────────────────────────────────────
    const stockBadge = (env) => {
        if (env.stockActual <= env.stockMinimo) return <Badge variant="destructive">Stock bajo</Badge>
        if (env.stockActual <= env.stockMinimo * 1.5) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Atención</Badge>
        return <Badge className="bg-green-100 text-green-800 border-green-200">OK</Badge>
    }

    // ── RENDER ─────────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            <SidebarProvider style={{ '--sidebar-width': '19rem', '--header-height': '4rem' }}>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <main className="flex-1 overflow-y-auto">
                            <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">

                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold flex items-center gap-2">
                                            <Package className="w-8 h-8 text-primary" />
                                            Stock Inteligente de Envases
                                        </h1>
                                        <p className="text-muted-foreground mt-1">
                                            Calcula el consumo de packaging a partir de los tickets del día
                                        </p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid grid-cols-3 w-full max-w-lg">
                                        <TabsTrigger value="dashboard">
                                            <TrendingUp className="w-4 h-4 mr-2" />Dashboard
                                        </TabsTrigger>
                                        <TabsTrigger value="recetas">
                                            <Layers className="w-4 h-4 mr-2" />Recetas
                                        </TabsTrigger>
                                        <TabsTrigger value="inventario">
                                            <Box className="w-4 h-4 mr-2" />Inventario
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* ══════════════════════════════════════ TAB DASHBOARD */}
                                    <TabsContent value="dashboard" className="space-y-6 mt-6">

                                        {/* Filtros de fecha */}
                                        <Card>
                                            <CardContent className="pt-4">
                                                <div className="flex flex-wrap gap-4 items-end">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">Desde</label>
                                                        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-44" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
                                                        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-44" />
                                                    </div>
                                                    <Button onClick={fetchConsumo} disabled={loading.consumo}>
                                                        <RefreshCw className={`w-4 h-4 mr-2 ${loading.consumo ? 'animate-spin' : ''}`} />
                                                        Calcular
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {loading.consumo && (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                Calculando consumo...
                                            </div>
                                        )}

                                        {consumo && !loading.consumo && (
                                            <>
                                                {/* KPIs */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <Card>
                                                        <CardContent className="pt-4">
                                                            <p className="text-xs text-muted-foreground">Tickets analizados</p>
                                                            <p className="text-2xl font-bold">{consumo.stats?.totalTickets}</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="pt-4">
                                                            <p className="text-xs text-muted-foreground">Días con actividad</p>
                                                            <p className="text-2xl font-bold">{consumo.stats?.diasConActividad}</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="pt-4">
                                                            <p className="text-xs text-muted-foreground">Envases con alerta</p>
                                                            <p className={`text-2xl font-bold ${consumo.stats?.totalAlertas > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {consumo.stats?.totalAlertas}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="pt-4">
                                                            <p className="text-xs text-muted-foreground">Período</p>
                                                            <p className="text-sm font-medium">{consumo.periodo?.desde} → {consumo.periodo?.hasta}</p>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Alertas */}
                                                {consumo.alertas?.length > 0 && (
                                                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                                                                <AlertTriangle className="w-5 h-5" />
                                                                Alertas de stock bajo
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {consumo.alertas.map(entry => (
                                                                    <div key={entry.envase.id} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-red-200">
                                                                        <p className="font-semibold text-sm">{entry.envase.nombre}</p>
                                                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                                            <span>Stock actual: <span className="font-bold text-red-600">{entry.stockActual} {entry.envase.unidad}</span></span>
                                                                            <span>Mínimo: {entry.stockMinimo}</span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            Consumido: <span className="font-bold">{entry.totalUnidades} {entry.envase.unidad}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* ── Gráficos ── */}
                                                {consumo.topConsumo?.length > 0 && (() => {
                                                    const CHART_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

                                                    // Donut data
                                                    const donutData = consumo.topConsumo.map((e, i) => ({
                                                        name: e.envase.nombre,
                                                        value: e.totalUnidades,
                                                        color: CHART_COLORS[i % CHART_COLORS.length],
                                                    }))

                                                    // Bar data: días × top envase names
                                                    const topNames = consumo.topConsumo.slice(0, 5).map(e => e.envase.nombre)
                                                    const allDays = [...new Set(
                                                        consumo.topConsumo.flatMap(e => e.porDia.map(d => d.fecha))
                                                    )].sort()
                                                    const barData = allDays.map(fecha => {
                                                        const row = { fecha: format(new Date(fecha + 'T12:00:00'), 'dd/MM', { locale: es }) }
                                                        consumo.topConsumo.slice(0, 5).forEach(e => {
                                                            const found = e.porDia.find(d => d.fecha === fecha)
                                                            row[e.envase.nombre] = found ? found.unidades : 0
                                                        })
                                                        return row
                                                    })

                                                    return (
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            {/* Donut */}
                                                            <Card>
                                                                <CardHeader className="pb-2">
                                                                    <CardTitle className="text-base">Distribución de consumo</CardTitle>
                                                                    <CardDescription>Porcentaje por tipo de envase</CardDescription>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="h-64">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <PieChart>
                                                                                <Pie
                                                                                    data={donutData}
                                                                                    cx="50%" cy="50%"
                                                                                    innerRadius={55} outerRadius={90}
                                                                                    paddingAngle={3}
                                                                                    dataKey="value"
                                                                                >
                                                                                    {donutData.map((entry, i) => (
                                                                                        <Cell key={i} fill={entry.color} />
                                                                                    ))}
                                                                                </Pie>
                                                                                <Tooltip
                                                                                    formatter={(v, n) => [`${v} ud`, n]}
                                                                                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                                                                />
                                                                            </PieChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                    {/* Legend */}
                                                                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                                                        {donutData.map((d, i) => (
                                                                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                                                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                                                                                <span className="text-muted-foreground">{d.name}</span>
                                                                                <span className="font-bold">{d.value}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>

                                                            {/* Bar */}
                                                            <Card>
                                                                <CardHeader className="pb-2">
                                                                    <CardTitle className="text-base">Consumo diario</CardTitle>
                                                                    <CardDescription>Top 5 envases por día</CardDescription>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="h-64">
                                                                        {barData.length === 0 ? (
                                                                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                                                                Sin datos diarios en el período
                                                                            </div>
                                                                        ) : (
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                                                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                                                                                    <YAxis tick={{ fontSize: 11 }} />
                                                                                    <Tooltip
                                                                                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                                                                        formatter={(v, n) => [`${v} ud`, n]}
                                                                                    />
                                                                                    {topNames.map((name, i) => (
                                                                                        <Bar key={name} dataKey={name} stackId="a"
                                                                                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                                                                                            radius={i === topNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                                                                        />
                                                                                    ))}
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        )}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Tabla completa de consumo */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Consumo detallado por envase</CardTitle>
                                                        <CardDescription>Haz clic en una fila para ver el desglose por día</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        {consumo.consumo?.length === 0 ? (
                                                            <p className="text-center text-muted-foreground py-8">
                                                                No hay datos de consumo. ¿Has configurado recetas?
                                                            </p>
                                                        ) : (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Envase</TableHead>
                                                                        <TableHead>Categoría</TableHead>
                                                                        <TableHead className="text-right">Consumido</TableHead>
                                                                        <TableHead className="text-right">Stock actual</TableHead>
                                                                        <TableHead className="text-right">Stock restante</TableHead>
                                                                        <TableHead>Estado</TableHead>
                                                                        <TableHead className="w-8"></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {consumo.consumo.flatMap(entry => [
                                                                        <TableRow
                                                                            key={entry.envase.id}
                                                                            className="cursor-pointer hover:bg-muted/50"
                                                                            onClick={() => setExpandedConsumo(expandedConsumo === entry.envase.id ? null : entry.envase.id)}
                                                                        >
                                                                            <TableCell className="font-medium">{entry.envase.nombre}</TableCell>
                                                                            <TableCell>
                                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[entry.envase.categoria] || 'bg-slate-100 text-slate-800'}`}>
                                                                                    {entry.envase.categoria}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-bold">{entry.totalUnidades} {entry.envase.unidad}</TableCell>
                                                                            <TableCell className="text-right">{entry.stockActual}</TableCell>
                                                                            <TableCell className={`text-right font-bold ${entry.stockRestante < 0 ? 'text-red-600' : entry.alerta ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                                {Math.round(entry.stockRestante)}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {entry.alerta
                                                                                    ? <Badge variant="destructive">Stock bajo</Badge>
                                                                                    : <Badge className="bg-green-100 text-green-800">OK</Badge>
                                                                                }
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {expandedConsumo === entry.envase.id
                                                                                    ? <ChevronUp className="w-4 h-4" />
                                                                                    : <ChevronDown className="w-4 h-4" />
                                                                                }
                                                                            </TableCell>
                                                                        </TableRow>,
                                                                        ...(expandedConsumo === entry.envase.id && entry.porDia.length > 0 ? [
                                                                            <TableRow key={`${entry.envase.id}-detail`}>
                                                                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                                                                        Consumo por día
                                                                                    </p>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {entry.porDia.map(d => (
                                                                                            <div key={d.fecha} className="bg-background rounded-lg px-3 py-1.5 border text-sm">
                                                                                                <span className="text-muted-foreground">{format(new Date(d.fecha + 'T12:00:00'), 'dd MMM', { locale: es })}</span>
                                                                                                <span className="font-bold ml-2">{d.unidades}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ] : [])
                                                                    ])}
                                                                </TableBody>
                                                            </Table>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </>
                                        )}

                                        {!consumo && !loading.consumo && (
                                            <Card>
                                                <CardContent className="py-14 text-center">
                                                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="font-semibold text-lg mb-2">Selecciona un rango de fechas</h3>
                                                    <p className="text-muted-foreground mb-4">Elige el período y pulsa "Calcular" para ver el consumo estimado de envases.</p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </TabsContent>

                                    {/* ══════════════════════════════════════ TAB RECETAS */}
                                    <TabsContent value="recetas" className="space-y-6 mt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold">Recetas de Packaging</h2>
                                                <p className="text-muted-foreground text-sm">Define qué envases consume cada producto vendido</p>
                                            </div>
                                            <Button onClick={openNewReceta} disabled={envases.length === 0}>
                                                <Plus className="w-4 h-4 mr-2" />Nueva receta
                                            </Button>
                                        </div>

                                        {envases.length === 0 && (
                                            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                                                <CardContent className="py-4">
                                                    <p className="text-yellow-800 dark:text-yellow-300 text-sm flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Primero crea envases en el tab <strong>Inventario</strong>, luego podrás configurar recetas.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {loading.recetas ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...
                                            </div>
                                        ) : recetas.length === 0 ? (
                                            <Card>
                                                <CardContent className="py-14 text-center">
                                                    <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="font-semibold text-lg mb-2">No hay recetas configuradas</h3>
                                                    <p className="text-muted-foreground text-sm mb-4">
                                                        Las recetas asocian un producto del ticket con los envases que consume.<br />
                                                        Ejemplo: "smoothie" → 1 Vaso 400ml + 1 Tapa plana + 1 Pajita
                                                    </p>
                                                    <Button onClick={openNewReceta} disabled={envases.length === 0}>
                                                        <Plus className="w-4 h-4 mr-2" />Crear primera receta
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <CardContent className="p-0">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Producto en ticket</TableHead>
                                                                <TableHead>Tipo match</TableHead>
                                                                <TableHead>Envase</TableHead>
                                                                <TableHead className="text-right">Cant. por unidad</TableHead>
                                                                <TableHead className="text-right">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {recetas.map(r => (
                                                                <TableRow key={r.id}>
                                                                    <TableCell>
                                                                        <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{r.productoNombre}</code>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline">
                                                                            {MATCH_TYPES.find(m => m.value === r.matchType)?.label || r.matchType}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${CAT_COLORS[r.envase?.categoria] || ''}`}>
                                                                                {r.envase?.categoria}
                                                                            </span>
                                                                            <span className="font-medium">{r.envase?.nombre}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-bold">{r.cantidad} {r.envase?.unidad}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end gap-1">
                                                                            <Button variant="ghost" size="icon" onClick={() => openEditReceta(r)}>
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteReceta(r.id)}>
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </TabsContent>

                                    {/* ══════════════════════════════════════ TAB INVENTARIO */}
                                    <TabsContent value="inventario" className="space-y-6 mt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold">Inventario de Envases</h2>
                                                <p className="text-muted-foreground text-sm">Gestiona el stock de materiales de packaging</p>
                                            </div>
                                            <Button onClick={openNewEnvase}>
                                                <Plus className="w-4 h-4 mr-2" />Nuevo envase
                                            </Button>
                                        </div>

                                        {loading.envases ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...
                                            </div>
                                        ) : envases.length === 0 ? (
                                            <Card>
                                                <CardContent className="py-14 text-center">
                                                    <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="font-semibold text-lg mb-2">No hay envases registrados</h3>
                                                    <p className="text-muted-foreground text-sm mb-4">
                                                        Registra tus materiales de packaging: vasos, tapas, pajitas, cucharas, bolsas...
                                                    </p>
                                                    <Button onClick={openNewEnvase}>
                                                        <Plus className="w-4 h-4 mr-2" />Añadir primer envase
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {envases.map(env => {
                                                    const pct = Math.min(100, Math.round((env.stockActual / Math.max(env.stockMinimo * 2, 1)) * 100))
                                                    const isLow = env.stockActual <= env.stockMinimo
                                                    const isWarn = !isLow && env.stockActual <= env.stockMinimo * 1.5
                                                    return (
                                                        <Card key={env.id} className={isLow ? 'border-red-200' : isWarn ? 'border-yellow-200' : ''}>
                                                            <CardContent className="pt-4">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold truncate">{env.nombre}</h3>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[env.categoria] || ''}`}>
                                                                            {env.categoria}
                                                                        </span>
                                                                    </div>
                                                                    {stockBadge(env)}
                                                                </div>

                                                                {/* Stock bar */}
                                                                <div className="mb-3">
                                                                    <div className="flex justify-between text-sm mb-1">
                                                                        <span className="text-muted-foreground">Stock actual</span>
                                                                        <span className="font-bold">{env.stockActual} {env.unidad}</span>
                                                                    </div>
                                                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : isWarn ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mt-1">Mínimo: {env.stockMinimo} {env.unidad}</p>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openAdjust(env)}>
                                                                        Ajustar stock
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => openEditEnvase(env)}>
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteEnvase(env.id)}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* ══════════════════════════════ DIALOG: ENVASE */}
            <Dialog open={envaseDialog} onOpenChange={setEnvaseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEnvase ? 'Editar envase' : 'Nuevo envase'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-sm font-medium block mb-1">Nombre *</label>
                            <Input
                                placeholder="ej: Vaso 400ml, Tapa plana, Pajita..."
                                value={envaseForm.nombre}
                                onChange={e => setEnvaseForm(p => ({ ...p, nombre: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Categoría *</label>
                            <Select value={envaseForm.categoria} onValueChange={v => setEnvaseForm(p => ({ ...p, categoria: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIAS_ENVASE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-sm font-medium block mb-1">Stock actual</label>
                                <Input type="number" min="0" value={envaseForm.stockActual} onChange={e => setEnvaseForm(p => ({ ...p, stockActual: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Stock mínimo</label>
                                <Input type="number" min="0" value={envaseForm.stockMinimo} onChange={e => setEnvaseForm(p => ({ ...p, stockMinimo: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Unidad</label>
                                <Input placeholder="ud" value={envaseForm.unidad} onChange={e => setEnvaseForm(p => ({ ...p, unidad: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEnvaseDialog(false)}>Cancelar</Button>
                        <Button onClick={saveEnvase} disabled={!envaseForm.nombre || !envaseForm.categoria}>
                            <Check className="w-4 h-4 mr-2" />Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════ DIALOG: RECETA */}
            <Dialog open={recetaDialog} onOpenChange={setRecetaDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingReceta ? 'Editar receta' : 'Nueva receta de packaging'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-sm font-medium block mb-1">Texto del producto en el ticket *</label>
                            <Input
                                placeholder="ej: smoothie, 1 bola, milkshake, xurro..."
                                value={recetaForm.productoNombre}
                                onChange={e => setRecetaForm(p => ({ ...p, productoNombre: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Se compara con el nombre del item en minúsculas</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Tipo de coincidencia</label>
                            <Select value={recetaForm.matchType} onValueChange={v => setRecetaForm(p => ({ ...p, matchType: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MATCH_TYPES.map(m => (
                                        <SelectItem key={m.value} value={m.value}>
                                            <div>
                                                <span className="font-medium">{m.label}</span>
                                                {m.value === 'contains' && <span className="text-xs text-muted-foreground ml-2">— el nombre del item contiene el texto</span>}
                                                {m.value === 'startsWith' && <span className="text-xs text-muted-foreground ml-2">— el nombre empieza por el texto</span>}
                                                {m.value === 'exact' && <span className="text-xs text-muted-foreground ml-2">— debe coincidir exactamente</span>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Envase *</label>
                            <Select value={recetaForm.envaseId} onValueChange={v => setRecetaForm(p => ({ ...p, envaseId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un envase" /></SelectTrigger>
                                <SelectContent>
                                    {envases.map(env => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.nombre} <span className="text-muted-foreground ml-1">({env.categoria})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Cantidad por unidad vendida *</label>
                            <Input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={recetaForm.cantidad}
                                onChange={e => setRecetaForm(p => ({ ...p, cantidad: parseFloat(e.target.value) || 1 }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Ej: si "1 smoothie" usa 1 vaso → cantidad = 1. Si "4 xurros" usa 1 bolsa → cantidad = 0.25 (por xurro)
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRecetaDialog(false)}>Cancelar</Button>
                        <Button onClick={saveReceta} disabled={!recetaForm.productoNombre || !recetaForm.envaseId}>
                            <Check className="w-4 h-4 mr-2" />Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════ DIALOG: AJUSTE STOCK */}
            <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Ajustar stock — {adjustEnvase?.nombre}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Stock actual: <span className="font-bold text-foreground">{adjustEnvase?.stockActual} {adjustEnvase?.unidad}</span>
                        </p>
                        <div>
                            <label className="text-sm font-medium block mb-1">Operación</label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'set', label: 'Establecer' },
                                    { value: 'add', label: '+ Añadir' },
                                    { value: 'subtract', label: '- Reducir' },
                                ].map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => setAdjustMode(m.value)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${adjustMode === m.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                {adjustMode === 'set' ? 'Nuevo total' : adjustMode === 'add' ? 'Cantidad a añadir' : 'Cantidad a reducir'} ({adjustEnvase?.unidad})
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={adjustValue}
                                onChange={e => setAdjustValue(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancelar</Button>
                        <Button onClick={saveAdjust}>
                            <Check className="w-4 h-4 mr-2" />Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}
