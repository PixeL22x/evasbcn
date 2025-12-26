'use client'

import { useState, useEffect } from 'react'
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
    Award
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DynamicIcon } from '@/components/DynamicIcon'
import { getIconForItem } from '@/lib/icon-mapper'

export default function TicketAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [days, setDays] = useState("30")

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/tickets-diarios/analytics?days=${days}`)
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
        fetchAnalytics()
    }, [days])

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
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h1 className="text-3xl font-bold">Analytics de Tickets</h1>
                                            <p className="text-muted-foreground">
                                                Análisis de ventas y tendencias de productos
                                            </p>
                                        </div>
                                        <Select value={days} onValueChange={setDays}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7">7 días</SelectItem>
                                                <SelectItem value="30">30 días</SelectItem>
                                                <SelectItem value="90">90 días</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{analytics.summary.totalSales.toFixed(2)}€</div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Últimos {days} días
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">Tickets Procesados</CardTitle>
                                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{analytics.summary.ticketCount}</div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Tickets escaneados
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{analytics.summary.avgTicket.toFixed(2)}€</div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Valor promedio por ticket
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">Top Producto</CardTitle>
                                                        <Award className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold truncate">{analytics.summary.topProduct}</div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Producto más vendido
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
                                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                            <XAxis
                                                                dataKey="date"
                                                                className="text-xs"
                                                                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                            />
                                                            <YAxis className="text-xs" />
                                                            <Tooltip
                                                                labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                                                                formatter={(value) => [`${value.toFixed(2)}€`, 'Total']}
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

                                            {/* Top Products */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Top 10 Productos</CardTitle>
                                                    <CardDescription>
                                                        Productos más vendidos por ingresos generados
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {analytics.topProducts.map((product, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-2xl font-bold text-muted-foreground w-8">
                                                                        #{idx + 1}
                                                                    </span>
                                                                    <DynamicIcon
                                                                        iconName={getIconForItem(product.nombre)}
                                                                        className="w-5 h-5 text-primary"
                                                                    />
                                                                    <div>
                                                                        <p className="font-semibold">{product.nombre}</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {product.cantidad} unidades vendidas
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                                                        {product.ingresos.toFixed(2)}€
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
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
