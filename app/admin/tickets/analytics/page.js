'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import {
    SidebarInset,
    SidebarProvider,
} from '@/components/ui/sidebar'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    TrendingUp,
    Receipt,
    DollarSign,
    Award,
    TrendingDown,
    ArrowLeft,
    Search,
    X,
    Package,
    ShoppingBag,
    Sparkles,
    FileText,
    BarChart2,
} from 'lucide-react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']
import { Progress } from "@/components/ui/progress"
import { DateRangePicker } from '@/components/DateRangePicker'
import { subDays } from 'date-fns'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { generateMonthlyPDF } from '@/lib/pdfReport'
import { generateProductSalesPDF } from '@/lib/pdfProductSalesReport'

// ─── General Analytics Tab ──────────────────────────────────────────────────

function GeneralTab() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [date, setDate] = useState({
        from: subDays(new Date(), 30),
        to: new Date(),
    })

    const daysDiff = date?.from && date?.to
        ? Math.ceil((date.to - date.from) / (1000 * 60 * 60 * 24))
        : 0

    const fetchAnalytics = async () => {
        try {
            if (!date?.from) return
            setLoading(true)
            let url = `/api/tickets-diarios/analytics?`
            if (date.from && date.to) {
                url += `from=${date.from.toISOString()}&to=${date.to.toISOString()}`
            } else if (date.from) {
                url += `from=${date.from.toISOString()}&to=${date.from.toISOString()}`
            }
            const res = await fetch(url)
            if (!res.ok) throw new Error('Error al cargar analytics')
            const data = await res.json()
            setAnalytics(data)
        } catch (err) {
            console.error(err)
            setError('No se pudieron cargar los analytics.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (date?.from) fetchAnalytics() }, [date])

    return (
        <div className="space-y-6">
            {/* Date controls */}
            <div className="flex flex-col gap-4">
                <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 w-max">
                        {[
                            { label: '7 días', days: 7 },
                            { label: '15 días', days: 15 },
                            { label: 'Este Mes', type: 'month' },
                            { label: '90 días', days: 90 },
                        ].map((preset) => (
                            <Button
                                key={preset.label}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const now = new Date()
                                    let from, to = now
                                    if (preset.type === 'month') {
                                        from = new Date(now.getFullYear(), now.getMonth(), 1)
                                    } else {
                                        from = subDays(now, preset.days)
                                    }
                                    setDate({ from, to })
                                }}
                                className={`rounded-full px-4 h-9 text-xs font-medium whitespace-nowrap transition-all active:scale-95
                                    ${(!preset.type && daysDiff === preset.days) ||
                                        (preset.type === 'month' && date?.from?.getDate() === 1)
                                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                        : 'bg-background text-muted-foreground hover:bg-accent'
                                    }`}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>
                <DateRangePicker date={date} setDate={setDate} className="w-full justify-center" />
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="mt-2 text-muted-foreground">Cargando analytics...</p>
                </div>
            ) : analytics ? (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Ventas</CardTitle>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-950 dark:text-blue-50">{analytics.summary.totalSales.toFixed(2)}€</div>
                                <p className="text-xs text-blue-600/80 mt-1">Últimos {daysDiff} días</p>
                            </CardContent>
                        </Card>
                        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Ticket Promedio</CardTitle>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">{analytics.summary.avgTicket.toFixed(2)}€</div>
                                <p className="text-xs text-emerald-600/80 mt-1">Promedio por ticket</p>
                            </CardContent>
                        </Card>
                        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Top Producto</CardTitle>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                    <Award className="h-4 w-4 text-amber-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-950 dark:text-amber-50 truncate">{analytics.summary.topProduct}</div>
                                <p className="text-xs text-amber-600/80 mt-1">Más vendido del período</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sales Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ventas Diarias</CardTitle>
                            <CardDescription>Evolución de ventas en el período seleccionado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.dailySales}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} dx={-10} />
                                    <Tooltip
                                        labelFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        formatter={(v) => [`${v.toFixed(2)}€`, 'Ventas']}
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    />
                                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Products Pie */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Productos</CardTitle>
                            <CardDescription>Distribución de ventas por unidad</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={analytics.topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="cantidad" nameKey="nombre">
                                        {analytics.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v, name, props) => {
                                            const total = analytics.topProducts.reduce((a, c) => a + c.cantidad, 0)
                                            return [`${v} u. (${((v / total) * 100).toFixed(0)}%)`, name]
                                        }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 flex flex-wrap justify-center gap-3">
                                {analytics.topProducts.map((e, i) => {
                                    const total = analytics.topProducts.reduce((a, c) => a + c.cantidad, 0)
                                    return (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-muted-foreground">{e.nombre}</span>
                                            <span className="font-bold">{((e.cantidad / total) * 100).toFixed(0)}%</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparación con Período Anterior</CardTitle>
                            <CardDescription>Cambios respecto a los {daysDiff} días anteriores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Ventas</span>
                                <div className="flex items-center gap-2">
                                    {analytics.comparison.sales >= 0
                                        ? <TrendingUp className="w-4 h-4 text-green-600" />
                                        : <TrendingDown className="w-4 h-4 text-red-600" />}
                                    <span className={`text-sm font-bold ${analytics.comparison.sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {analytics.comparison.sales > 0 ? '+' : ''}{analytics.comparison.sales}%
                                    </span>
                                </div>
                            </div>
                            <Progress value={Math.min(Math.abs(analytics.comparison.sales), 100)}
                                className={`h-2 ${analytics.comparison.sales >= 0 ? '[&>div]:bg-green-600' : '[&>div]:bg-red-600'}`} />
                        </CardContent>
                    </Card>

                    {/* Daily detail table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle Diario</CardTitle>
                            <CardDescription>Desglose de ventas por día</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Ventas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.dailySales?.length > 0 ? analytics.dailySales.map((day) => (
                                        <TableRow key={day.date}>
                                            <TableCell>{new Date(day.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</TableCell>
                                            <TableCell className="text-right font-medium">{day.total.toFixed(2)}€</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">No hay datos para este período</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    )
}

// ─── Por Producto Tab ───────────────────────────────────────────────────────

function ProductTab() {
    const [allNames, setAllNames] = useState([])
    const [chips, setChips] = useState([]) // selected product terms
    const [inputValue, setInputValue] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [date, setDate] = useState({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() })
    const [groupBy, setGroupBy] = useState('month')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [error, setError] = useState(null)
    const inputRef = useRef(null)

    // Load all product names for autocomplete
    useEffect(() => {
        fetch('/api/tickets-diarios/product-names')
            .then(r => r.json())
            .then(d => setAllNames(d.names || []))
            .catch(() => { })
    }, [])

    // Autocomplete filter
    useEffect(() => {
        const q = inputValue.toLowerCase().trim()
        if (!q) { setSuggestions([]); return }
        setSuggestions(
            allNames
                .filter(n => n.toLowerCase().includes(q) && !chips.includes(n))
                .slice(0, 8)
        )
    }, [inputValue, allNames, chips])

    const addChip = (name) => {
        if (!chips.includes(name)) setChips(prev => [...prev, name])
        setInputValue('')
        setSuggestions([])
        inputRef.current?.focus()
    }

    const removeChip = (name) => setChips(prev => prev.filter(c => c !== name))

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            addChip(inputValue.trim())
        }
        if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
            removeChip(chips[chips.length - 1])
        }
    }

    const fetchData = async (withAi = false) => {
        if (chips.length === 0) return
        withAi ? setAiLoading(true) : setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({
                products: chips.join(','),
                from: date.from.toISOString(),
                to: date.to.toISOString(),
                groupBy,
                aiInsight: withAi ? 'true' : 'false',
            })
            const res = await fetch(`/api/tickets-diarios/product-sales?${params}`)
            if (!res.ok) throw new Error('Error al obtener datos')
            const result = await res.json()
            setData(prev => withAi ? { ...prev, aiInsight: result.aiInsight } : result)
        } catch (err) {
            setError('No se pudieron cargar los datos. Inténtalo de nuevo.')
        } finally {
            withAi ? setAiLoading(false) : setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Search Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar productos
                    </CardTitle>
                    <CardDescription>
                        Escribe el nombre de un producto (o parte) y pulsa Enter. Puedes añadir varios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Chip input */}
                    <div
                        className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-md border border-input bg-background cursor-text"
                        onClick={() => inputRef.current?.focus()}
                    >
                        {chips.map(chip => (
                            <Badge key={chip} variant="secondary" className="gap-1 pr-1 text-sm">
                                {chip}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeChip(chip) }}
                                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={chips.length === 0 ? 'Ej: vainilla, cono, churro...' : ''}
                            autoCapitalize="none"
                            autoCorrect="off"
                            autoComplete="off"
                            inputMode="search"
                            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground touch-manipulation"
                        />
                    </div>

                    {/* Autocomplete dropdown */}
                    {suggestions.length > 0 && (
                        <div className="border rounded-md shadow-sm bg-popover overflow-hidden">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => addChip(s)}
                                    className="w-full text-left px-3 py-3 min-h-[44px] text-sm hover:bg-muted active:bg-muted transition-colors flex items-center gap-2 touch-manipulation"
                                >
                                    <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Controls row */}
                    <div className="flex flex-col gap-3">
                        <DateRangePicker date={date} setDate={setDate} className="w-full" />
                        <div className="flex gap-3">
                            <Select value={groupBy} onValueChange={setGroupBy}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Por día</SelectItem>
                                    <SelectItem value="week">Por semana</SelectItem>
                                    <SelectItem value="month">Por mes</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={() => fetchData(false)}
                                disabled={chips.length === 0 || loading}
                                className="flex-1 gap-2 min-h-[44px] touch-manipulation"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
                                Analizar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

            {data && (
                <div className="space-y-6">
                    {/* Download PDF Button */}
                    <div className="flex">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto sm:ml-auto gap-2 min-h-[44px] touch-manipulation border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
                            onClick={() => generateProductSalesPDF({ chips, date, groupBy, summary: data.summary, trend: data.trend, breakdown: data.breakdown, aiInsight: data.aiInsight })}
                        >
                            <FileText className="h-4 w-4" />
                            Descargar PDF
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-medium text-blue-900 dark:text-blue-100">Ingresos</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-950 dark:text-blue-50">{data.summary.totalRevenue.toFixed(2)}€</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 shadow-sm">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-medium text-emerald-900 dark:text-emerald-100">Unidades</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">{data.summary.totalUnits}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-sm">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-medium text-amber-900 dark:text-amber-100">Precio medio</CardTitle>
                                <Award className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-950 dark:text-amber-50">{data.summary.avgPricePerUnit.toFixed(2)}€</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 shadow-sm">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-medium text-violet-900 dark:text-violet-100">En tickets</CardTitle>
                                <Receipt className="h-4 w-4 text-violet-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-violet-950 dark:text-violet-50">{data.summary.ticketsAppeared}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Trend Chart */}
                    {data.trend.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tendencia de ventas</CardTitle>
                                <CardDescription>Evolución de ingresos y unidades en el período</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={data.trend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                                        <XAxis dataKey="period" tickLine={false} axisLine={false} dy={8} tick={{ fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} tick={{ fontSize: 10 }} width={40} />
                                        <Tooltip
                                            formatter={(v, name) => name === 'revenue' ? [`${v.toFixed(2)}€`, 'Ingresos'] : [v, 'Unidades']}
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                        />
                                        <Bar dataKey="revenue" name="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="units" name="units" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-500 inline-block" />Ingresos (€)</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Unidades</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Breakdown Table */}
                    {data.breakdown.length > 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Desglose por variante</CardTitle>
                                <CardDescription>Detalle de cada línea de producto encontrada</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Ingresos</TableHead>
                                                <TableHead className="text-right">Unidades</TableHead>
                                                <TableHead className="text-right">% ingreso</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.breakdown.map((b, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{b.product}</TableCell>
                                                    <TableCell className="text-right">{b.revenue.toFixed(2)}€</TableCell>
                                                    <TableCell className="text-right">{b.units}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {data.summary.totalRevenue > 0
                                                            ? `${((b.revenue / data.summary.totalRevenue) * 100).toFixed(1)}%`
                                                            : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Insight */}
                    <Card className={data.aiInsight ? 'border-purple-200' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                <Sparkles className="h-5 w-5" />
                                Análisis IA
                            </CardTitle>
                            <CardDescription>Gemini analiza las tendencias y recomienda acciones</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.aiInsight ? (
                                <div className="space-y-2">
                                    {data.aiInsight.split('\n').filter(Boolean).map((line, i) => (
                                        <p key={i} className="text-sm leading-relaxed">{line}</p>
                                    ))}
                                </div>
                            ) : (
                                <Button
                                    onClick={() => fetchData(true)}
                                    disabled={aiLoading}
                                    variant="outline"
                                    className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                    {aiLoading
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                                        : <><Sparkles className="h-4 w-4" /> Generar análisis IA</>
                                    }
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {!data && !loading && chips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
                    <Package className="h-12 w-12 opacity-30" />
                    <p className="text-lg font-medium">Busca uno o varios productos</p>
                    <p className="text-sm">Escribe el nombre (o parte) del producto y pulsa Enter para añadirlo</p>
                </div>
            )}
        </div>
    )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TicketAnalyticsPage() {
    return (
        <AdminLayout>
            <SidebarProvider
                style={{
                    "--sidebar-width": "19rem",
                    "--header-height": "4rem",
                }}
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <main className="flex-1 overflow-y-auto">
                            <div className="container mx-auto px-4 py-6 max-w-7xl">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h1 className="text-3xl font-bold">Analytics de Tickets</h1>
                                        <p className="text-muted-foreground">Análisis de ventas, tendencias y productos</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            id="btn-generate-report"
                                            onClick={async () => {
                                                const now = new Date()
                                                const res = await fetch(`/api/admin/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
                                                if (!res.ok) return alert('Error al generar datos')
                                                const data = await res.json()
                                                generateMonthlyPDF({ ...data, month: now.getMonth() + 1, year: now.getFullYear() })
                                            }}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Informe Mensual IA
                                            <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <Link href="/admin/tickets">
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Volver
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <Tabs defaultValue="general" className="space-y-6">
                                    <TabsList className="grid w-full max-w-sm grid-cols-2">
                                        <TabsTrigger value="general" className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            General
                                        </TabsTrigger>
                                        <TabsTrigger value="por-producto" className="flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Por Producto
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="general">
                                        <GeneralTab />
                                    </TabsContent>

                                    <TabsContent value="por-producto">
                                        <ProductTab />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AdminLayout>
    )
}
