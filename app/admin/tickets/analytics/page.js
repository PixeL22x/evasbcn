'use client'

import { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Loader2,
    TrendingUp,
    Receipt,
    DollarSign,
    Award,
    TrendingDown,
    ArrowLeft
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
    Legend
} from 'recharts'
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
import { Progress } from "@/components/ui/progress"
import { DynamicIcon } from '@/components/DynamicIcon'
import { getIconForItem } from '@/lib/icon-mapper'
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

export default function TicketAnalyticsPage() {
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
                // If only one day selected, use it as both from and to
                url += `from=${date.from.toISOString()}&to=${date.from.toISOString()}`
            }

            const res = await fetch(url)
            if (!res.ok) throw new Error('Error al cargar analytics')
            const data = await res.json()
            setAnalytics(data)
        } catch (err) {
            console.error(err)
            setError('No se pudieron cargar los analytics. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (date?.from) {
            fetchAnalytics()
        }
    }, [date])

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
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h1 className="text-3xl font-bold">Analytics de Tickets</h1>
                                            <p className="text-muted-foreground">
                                                Análisis de ventas y tendencias de productos
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <Button variant="outline" asChild className="w-full sm:w-auto">
                                                <Link href="/admin/tickets">
                                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                                    Volver a Tickets
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Date Controls (Segmented Style) */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mb-6">
                                        {/* Presets */}
                                        <div className="flex items-center justify-between p-1 bg-muted/50 rounded-lg border shadow-sm w-full sm:w-auto">
                                            {[
                                                { label: '7d', days: 7 },
                                                { label: '30d', days: 30 },
                                                { label: '90d', days: 90 },
                                            ].map((preset) => (
                                                <Button
                                                    key={preset.days}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDate({ from: subDays(new Date(), preset.days), to: new Date() })}
                                                    className={`flex-1 sm:flex-none h-8 px-3 text-xs font-medium rounded-md transition-all ${daysDiff <= preset.days && daysDiff > (preset.days === 7 ? 1 : (preset.days === 30 ? 7 : 30))
                                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                                        }`}
                                                >
                                                    {preset.label}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Picker */}
                                        <div className="w-full sm:w-auto">
                                            <DateRangePicker
                                                date={date}
                                                setDate={setDate}
                                                className="w-full sm:w-[260px] h-10 sm:h-auto justify-center sm:justify-start bg-background border shadow-sm hover:bg-background/90"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                            <strong className="font-bold">Error:</strong>
                                            <span className="block sm:inline"> {error}</span>
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="mt-2 text-muted-foreground">Cargando analytics...</p>
                                        </div>
                                    ) : analytics ? (
                                        <div className="space-y-6">
                                            {/* KPI Cards */}
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm hover:shadow-md transition-all">
                                                    <div className="absolute right-0 top-0 h-full w-full opacity-[0.03] pointer-events-none">
                                                        <DollarSign className="h-full w-auto ml-auto" />
                                                    </div>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Ventas</CardTitle>
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="relative z-10">
                                                        <div className="text-3xl font-bold text-blue-950 dark:text-blue-50">{analytics.summary.totalSales.toFixed(2)}€</div>
                                                        <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-1 font-medium">
                                                            Últimos {daysDiff} días
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-sm hover:shadow-md transition-all">
                                                    <div className="absolute right-0 top-0 h-full w-full opacity-[0.03] pointer-events-none">
                                                        <Award className="h-full w-auto ml-auto" />
                                                    </div>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                                        <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Top Producto</CardTitle>
                                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                                            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="relative z-10">
                                                        <div className="text-2xl font-bold text-amber-950 dark:text-amber-50 truncate" title={analytics.summary.topProduct}>
                                                            {analytics.summary.topProduct}
                                                        </div>
                                                        <p className="text-xs text-amber-600/80 dark:text-amber-300/80 mt-1 font-medium">
                                                            Más vendido del período
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Sales Chart */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Ventas Diarias</CardTitle>
                                                    <CardDescription>
                                                        Evolución de ventas en el período seleccionado
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <LineChart data={analytics.dailySales}>
                                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                                                            <XAxis
                                                                dataKey="date"
                                                                className="text-xs font-medium text-muted-foreground"
                                                                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                dy={10}
                                                            />
                                                            <YAxis
                                                                className="text-xs font-medium text-muted-foreground"
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(value) => `${value}€`}
                                                                dx={-10}
                                                            />
                                                            <Tooltip
                                                                labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                formatter={(value) => [`${value.toFixed(2)}€`, 'Ventas']}
                                                                contentStyle={{
                                                                    backgroundColor: 'hsl(var(--popover))',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid hsl(var(--border))',
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                    color: 'hsl(var(--popover-foreground))',
                                                                    padding: '8px 12px',
                                                                }}
                                                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', fontWeight: 500 }}
                                                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '4 4' }}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="total"
                                                                stroke="hsl(var(--primary))"
                                                                strokeWidth={2}
                                                                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            {/* Top Products Pie Chart */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Top Productos</CardTitle>
                                                    <CardDescription>
                                                        Distribución de ventas por unidad
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <PieChart>
                                                            <Pie
                                                                data={analytics.topProducts}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="cantidad"
                                                                nameKey="nombre"
                                                            >
                                                                {analytics.topProducts.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value, name, props) => {
                                                                    const total = analytics.topProducts.reduce((acc, curr) => acc + curr.cantidad, 0);
                                                                    const percent = ((value / total) * 100).toFixed(0);
                                                                    return [`${value} u. (${percent}%)`, name];
                                                                }}
                                                                contentStyle={{
                                                                    backgroundColor: 'hsl(var(--popover))',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid hsl(var(--border))',
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                    color: 'hsl(var(--popover-foreground))',
                                                                    padding: '8px 12px',
                                                                }}
                                                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="mt-2 flex flex-wrap justify-center gap-3">
                                                        {analytics.topProducts.map((entry, index) => {
                                                            const total = analytics.topProducts.reduce((acc, curr) => acc + curr.cantidad, 0);
                                                            const percent = ((entry.cantidad / total) * 100).toFixed(0);
                                                            return (
                                                                <div key={`legend-${index}`} className="flex items-center gap-2 text-xs">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                                    />
                                                                    <span className="font-medium text-muted-foreground">{entry.nombre}</span>
                                                                    <span className="font-bold text-foreground">{percent}%</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>



                                            {/* Comparación con Período Anterior */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Comparación con Período Anterior</CardTitle>
                                                    <CardDescription>
                                                        Cambios respecto a los {daysDiff} días anteriores
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium">Ventas</span>
                                                                <div className="flex items-center gap-2">
                                                                    {analytics.comparison.sales >= 0 ? (
                                                                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                    ) : (
                                                                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                                    )}
                                                                    <span className={`text-sm font-bold ${analytics.comparison.sales >= 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                        }`}>
                                                                        {analytics.comparison.sales > 0 ? '+' : ''}{analytics.comparison.sales}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Progress
                                                                value={Math.min(Math.abs(analytics.comparison.sales), 100)}
                                                                className={`h-2 ${analytics.comparison.sales >= 0
                                                                    ? '[&>div]:bg-green-600'
                                                                    : '[&>div]:bg-red-600'
                                                                    }`}
                                                            />
                                                        </div>


                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Detalle Diario Table */}
                                            <div className="col-span-full">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Detalle Diario</CardTitle>
                                                        <CardDescription>
                                                            Desglose de ventas por día
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Fecha</TableHead>

                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {analytics.dailySales && analytics.dailySales.length > 0 ? (
                                                                    analytics.dailySales.map((day) => (
                                                                        <TableRow key={day.date}>
                                                                            <TableCell>
                                                                                {new Date(day.date).toLocaleDateString('es-ES', {
                                                                                    year: 'numeric',
                                                                                    month: 'long',
                                                                                    day: 'numeric',
                                                                                    weekday: 'long'
                                                                                })}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-medium">
                                                                                {day.total.toFixed(2)}€
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                                <Receipt className="h-8 w-8 text-muted-foreground/50" />
                                                                                <p>No hay datos para este período</p>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AdminLayout>
    )
}
