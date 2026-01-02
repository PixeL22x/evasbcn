'use client'

import { useState, useEffect, useMemo } from 'react'
import { getIconForItem } from '@/lib/icon-mapper'
import { DynamicIcon } from '@/components/DynamicIcon'
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
    CardHeader,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Calendar as CalendarIcon,
    Euro,
    ImageIcon,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    Trash2,
    TrendingUp,
    Search,
    X,
    User,
    Hash,
    ChevronLeft,
    ChevronRight,
    Download,
    LayoutGrid,
    MoreVertical,
    FileText,
    Table as TableIcon,
    ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"

export default function TicketsPage() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [editingDateId, setEditingDateId] = useState(null)
    const [expandedId, setExpandedId] = useState(null)

    // Filtros
    const [searchQuery, setSearchQuery] = useState('')

    const [minTotal, setMinTotal] = useState('')
    const [maxTotal, setMaxTotal] = useState('')

    // Paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(12)

    // Ordenamiento
    const [sortBy, setSortBy] = useState('fecha-desc')

    // Selección múltiple
    const [selectedTickets, setSelectedTickets] = useState([])

    // Vista
    const [viewMode, setViewMode] = useState('cards')

    const fetchTickets = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/tickets-diarios')
            if (!res.ok) throw new Error('Error al cargar tickets')
            const data = await res.json()
            setTickets(data.tickets)
        } catch (err) {
            console.error(err)
            setError('No se pudieron cargar los tickets. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTicket = async (ticketId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const res = await fetch(`/api/tickets-diarios/${ticketId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Error al eliminar ticket');

            await fetchTickets();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el ticket. Intenta de nuevo.');
        }
    }

    const handleUpdateDate = async (ticketId, newDate) => {
        try {
            const res = await fetch(`/api/tickets-diarios/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha: newDate })
            });

            if (!res.ok) throw new Error('Error al actualizar fecha');

            await fetchTickets();
            setEditingDateId(null);
        } catch (err) {
            console.error(err);
            alert('Error al actualizar la fecha. Intenta de nuevo.');
        }
    }

    const clearFilters = () => {
        setSearchQuery('')

        setMinTotal('')
        setMaxTotal('')
        setCurrentPage(1)
    }

    // Exportación a CSV
    const exportToCSV = (ticketsToExport = filteredAndSortedTickets) => {
        const headers = ['Fecha', 'Total (€)', 'Items', 'Estado', 'Trabajador', 'Turno', 'ID']
        const rows = ticketsToExport.map(t => [
            t.fecha ? format(new Date(t.fecha), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A',
            t.total?.toFixed(2) || '0.00',
            t.items?.length || 0,
            t.status || 'N/A',
            t.cierre?.trabajador?.nombre || 'N/A',
            t.cierre?.turno || 'N/A',
            t.id
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tickets-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Exportación a Excel (TSV para mejor compatibilidad)
    const exportToExcel = (ticketsToExport = filteredAndSortedTickets) => {
        const headers = ['Fecha', 'Total (€)', 'Items', 'Estado', 'Trabajador', 'Turno', 'ID', 'Productos']
        const rows = ticketsToExport.map(t => [
            t.fecha ? format(new Date(t.fecha), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A',
            t.total?.toFixed(2) || '0.00',
            t.items?.length || 0,
            t.status || 'N/A',
            t.cierre?.trabajador?.nombre || 'N/A',
            t.cierre?.turno || 'N/A',
            t.id,
            t.items?.map(i => `${i.nombre} (${i.cantidad})`).join('; ') || 'N/A'
        ])

        const tsv = [headers, ...rows].map(row => row.join('\t')).join('\n')
        const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tickets-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xls`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Selección múltiple
    const toggleTicketSelection = (ticketId) => {
        setSelectedTickets(prev =>
            prev.includes(ticketId)
                ? prev.filter(id => id !== ticketId)
                : [...prev, ticketId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedTickets.length === paginatedTickets.length) {
            setSelectedTickets([])
        } else {
            setSelectedTickets(paginatedTickets.map(t => t.id))
        }
    }

    // Eliminar múltiples tickets
    const handleBulkDelete = async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedTickets.length} ticket(s)? Esta acción no se puede deshacer.`)) {
            return
        }

        try {
            await Promise.all(
                selectedTickets.map(id =>
                    fetch(`/api/tickets-diarios/${id}`, { method: 'DELETE' })
                )
            )
            await fetchTickets()
            setSelectedTickets([])
        } catch (err) {
            console.error(err)
            alert('Error al eliminar los tickets. Intenta de nuevo.')
        }
    }

    // Exportar seleccionados
    const handleBulkExport = () => {
        const ticketsToExport = tickets.filter(t => selectedTickets.includes(t.id))
        exportToCSV(ticketsToExport)
    }

    // Filtrado y ordenamiento
    const filteredAndSortedTickets = useMemo(() => {
        let filtered = [...tickets]

        // Filtro por búsqueda
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(ticket =>
                ticket.items?.some(item => item.nombre.toLowerCase().includes(query)) ||
                ticket.total?.toString().includes(query) ||
                ticket.id.toLowerCase().includes(query)
            )
        }



        // Filtro por rango de total
        if (minTotal !== '') {
            filtered = filtered.filter(ticket => ticket.total >= parseFloat(minTotal))
        }
        if (maxTotal !== '') {
            filtered = filtered.filter(ticket => ticket.total <= parseFloat(maxTotal))
        }

        // Ordenamiento
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'fecha-desc':
                    return new Date(b.fecha) - new Date(a.fecha)
                case 'fecha-asc':
                    return new Date(a.fecha) - new Date(b.fecha)
                case 'total-desc':
                    return (b.total || 0) - (a.total || 0)
                case 'total-asc':
                    return (a.total || 0) - (b.total || 0)
                case 'items-desc':
                    return (b.items?.length || 0) - (a.items?.length || 0)
                default:
                    return 0
            }
        })

        return filtered
    }, [tickets, searchQuery, minTotal, maxTotal, sortBy])

    // Paginación
    const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage)
    const paginatedTickets = filteredAndSortedTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, minTotal, maxTotal, sortBy])

    useEffect(() => {
        fetchTickets()
    }, [])

    const hasActiveFilters = searchQuery || minTotal || maxTotal

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
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h1 className="text-3xl font-bold">Tickets del Día</h1>
                                            <p className="text-muted-foreground">
                                                {filteredAndSortedTickets.length} ticket{filteredAndSortedTickets.length !== 1 ? 's' : ''} encontrado{filteredAndSortedTickets.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            {/* Toggle Vista */}
                                            <Tabs value={viewMode} onValueChange={setViewMode}>
                                                <TabsList>
                                                    <TabsTrigger value="cards">
                                                        <LayoutGrid className="w-4 h-4 mr-2" />
                                                        Cards
                                                    </TabsTrigger>
                                                    <TabsTrigger value="table">
                                                        <TableIcon className="w-4 h-4 mr-2" />
                                                        Tabla
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>

                                            {/* Exportar */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Exportar
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => exportToCSV()}>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Exportar a CSV
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => exportToExcel()}>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Exportar a Excel
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button variant="outline" onClick={() => window.location.href = '/admin/tickets/analytics'}>
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                Analytics
                                            </Button>
                                            <Button onClick={fetchTickets} disabled={loading}>
                                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                                Actualizar
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Filtros */}
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                {/* Primera fila: Búsqueda y Estado */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {/* Búsqueda */}
                                                    <div className="lg:col-span-2">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Buscar por items, total, ID..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="pl-9"
                                                            />
                                                        </div>
                                                    </div>



                                                    {/* Ordenar */}
                                                    <Select value={sortBy} onValueChange={setSortBy}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fecha-desc">Más reciente</SelectItem>
                                                            <SelectItem value="fecha-asc">Más antiguo</SelectItem>
                                                            <SelectItem value="total-desc">Mayor total</SelectItem>
                                                            <SelectItem value="total-asc">Menor total</SelectItem>
                                                            <SelectItem value="items-desc">Más items</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Segunda fila: Rango de total */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                                    <span className="text-sm text-muted-foreground whitespace-nowrap">Rango de total:</span>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <Input
                                                            type="number"
                                                            placeholder="Min €"
                                                            value={minTotal}
                                                            onChange={(e) => setMinTotal(e.target.value)}
                                                            className="w-28"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                        <span className="text-muted-foreground">-</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Max €"
                                                            value={maxTotal}
                                                            onChange={(e) => setMaxTotal(e.target.value)}
                                                            className="w-28"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>

                                                    {hasActiveFilters && (
                                                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                                                            <X className="w-4 h-4 mr-2" />
                                                            Limpiar filtros
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {error && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                            <strong className="font-bold">Error:</strong>
                                            <span className="block sm:inline"> {error}</span>
                                        </div>
                                    )}

                                    {loading && tickets.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                            <p className="mt-4 text-muted-foreground">Cargando tickets...</p>
                                        </div>
                                    ) : filteredAndSortedTickets.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-12 text-center">
                                                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No se encontraron tickets</h3>
                                                <p className="text-muted-foreground mb-4">
                                                    {hasActiveFilters
                                                        ? 'Intenta ajustar los filtros de búsqueda'
                                                        : 'No hay tickets disponibles'
                                                    }
                                                </p>
                                                {hasActiveFilters && (
                                                    <Button variant="outline" onClick={clearFilters}>
                                                        Limpiar filtros
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <>
                                            {viewMode === 'cards' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                    {paginatedTickets.map((ticket) => (
                                                        <Card key={ticket.id} className="flex flex-col">
                                                            {/* Header Card */}
                                                            <CardHeader className="border-b pb-3">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 text-muted-foreground flex-1 min-w-0">
                                                                            <Checkbox
                                                                                checked={selectedTickets.includes(ticket.id)}
                                                                                onCheckedChange={() => toggleTicketSelection(ticket.id)}
                                                                            />
                                                                            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                                                            {editingDateId === ticket.id ? (
                                                                                <input
                                                                                    type="datetime-local"
                                                                                    defaultValue={new Date(ticket.fecha).toISOString().slice(0, 16)}
                                                                                    onBlur={(e) => handleUpdateDate(ticket.id, e.target.value)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') {
                                                                                            handleUpdateDate(ticket.id, e.target.value)
                                                                                        } else if (e.key === 'Escape') {
                                                                                            setEditingDateId(null)
                                                                                        }
                                                                                    }}
                                                                                    autoFocus
                                                                                    className="text-sm font-medium px-2 py-1 rounded border border-primary flex-1"
                                                                                />
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => setEditingDateId(ticket.id)}
                                                                                    className="text-sm font-medium capitalize hover:text-primary transition-colors truncate"
                                                                                >
                                                                                    {ticket.fecha
                                                                                        ? format(new Date(ticket.fecha), "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })
                                                                                        : 'Fecha desconocida'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">

                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleDeleteTicket(ticket.id)}
                                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Información de contexto */}
                                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                                        {ticket.cierre?.trabajador && (
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="w-3 h-3" />
                                                                                <span>{ticket.cierre.trabajador.nombre}</span>
                                                                            </div>
                                                                        )}
                                                                        {ticket.cierre?.turno && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                <span className="capitalize">{ticket.cierre.turno}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1">
                                                                            <Hash className="w-3 h-3" />
                                                                            <span className="font-mono">{ticket.id.slice(-8)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>

                                                            {/* Contenido Principal */}
                                                            <CardContent className="flex-1 p-4">
                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    {/* Total */}
                                                                    <div className="flex items-center gap-2">
                                                                        <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Total</p>
                                                                            <p className="text-lg font-bold">{ticket.total ? `${ticket.total.toFixed(2)}€` : 'N/A'}</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Imagen */}
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setSelectedImage(ticket.imageUrl)}
                                                                            className="w-full"
                                                                        >
                                                                            <ImageIcon className="w-4 h-4 mr-2" />
                                                                            Ver Imagen
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Items */}
                                                                <div>
                                                                    <p className="text-sm font-semibold mb-2">Items ({ticket.items?.length || 0})</p>
                                                                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                                                                        {ticket.items && Array.isArray(ticket.items) && ticket.items.length > 0 ? (
                                                                            ticket.items.map((item, idx) => (
                                                                                <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg border bg-card hover:bg-accent transition-colors">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <DynamicIcon
                                                                                            iconName={getIconForItem(item.nombre)}
                                                                                            className="w-5 h-5 text-primary"
                                                                                        />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-semibold">{item.nombre}</span>
                                                                                            <span className="text-xs text-muted-foreground">Cant: {item.cantidad}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="font-bold text-green-600 dark:text-green-400">{item.precio?.toFixed(2)}€</span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-sm text-muted-foreground text-center py-4">No hay items</p>
                                                                        )}

                                                                    </div>
                                                                </div>

                                                                {/* Expandable Section */}
                                                                <div className="mt-4 pt-2 border-t">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                                                                        className="w-full text-muted-foreground hover:text-primary"
                                                                    >
                                                                        {expandedId === ticket.id ? 'Ver menos' : 'Ver más detalles'}
                                                                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${expandedId === ticket.id ? 'rotate-180' : ''}`} />
                                                                    </Button>

                                                                    {expandedId === ticket.id && (
                                                                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                            <div>
                                                                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Análisis del Ticket</p>
                                                                                <div className="grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-lg">
                                                                                    <div>
                                                                                        <span className="text-xs text-muted-foreground block">Items únicos</span>
                                                                                        <span className="text-sm font-medium">
                                                                                            {new Set(ticket.items?.map(i => i.nombre) || []).size}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs text-muted-foreground block">Precio promedio</span>
                                                                                        <span className="text-sm font-medium">
                                                                                            {ticket.items && ticket.items.length > 0
                                                                                                ? (ticket.total / ticket.items.reduce((sum, i) => sum + (i.cantidad || 1), 0)).toFixed(2)
                                                                                                : '0.00'}€
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Card>
                                                    <CardContent className="p-0">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-12">
                                                                        <Checkbox
                                                                            checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0}
                                                                            onCheckedChange={toggleSelectAll}
                                                                        />
                                                                    </TableHead>
                                                                    <TableHead>Fecha</TableHead>
                                                                    <TableHead>Total</TableHead>
                                                                    <TableHead>Items</TableHead>


                                                                    <TableHead className="text-right">Acciones</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {paginatedTickets.map((ticket) => (
                                                                    <TableRow key={ticket.id}>
                                                                        <TableCell>
                                                                            <Checkbox
                                                                                checked={selectedTickets.includes(ticket.id)}
                                                                                onCheckedChange={() => toggleTicketSelection(ticket.id)}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className="font-medium">
                                                                            {ticket.fecha
                                                                                ? format(new Date(ticket.fecha), "dd/MM/yyyy HH:mm", { locale: es })
                                                                                : 'N/A'}
                                                                        </TableCell>
                                                                        <TableCell className="font-bold text-green-600 dark:text-green-400">
                                                                            {ticket.total ? `${ticket.total.toFixed(2)}€` : 'N/A'}
                                                                        </TableCell>
                                                                        <TableCell>{ticket.items?.length || 0}</TableCell>


                                                                        <TableCell className="text-right">
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" size="icon">
                                                                                        <MoreVertical className="w-4 h-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem onClick={() => setSelectedImage(ticket.imageUrl)}>
                                                                                        <ImageIcon className="w-4 h-4 mr-2" />
                                                                                        Ver imagen
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setEditingDateId(ticket.id)}>
                                                                                        <CalendarIcon className="w-4 h-4 mr-2" />
                                                                                        Editar fecha
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        onClick={() => handleDeleteTicket(ticket.id)}
                                                                                        className="text-destructive"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                                        Eliminar
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Paginación */}
                                            {totalPages > 1 && (
                                                <Card>
                                                    <CardContent className="py-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm text-muted-foreground">
                                                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedTickets.length)} de {filteredAndSortedTickets.length} tickets
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                                                                    <SelectTrigger className="w-32">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="12">12 por página</SelectItem>
                                                                        <SelectItem value="24">24 por página</SelectItem>
                                                                        <SelectItem value="48">48 por página</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={currentPage === 1}
                                                                >
                                                                    <ChevronLeft className="w-4 h-4" />
                                                                </Button>

                                                                <span className="text-sm px-2">
                                                                    Página {currentPage} de {totalPages}
                                                                </span>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                    disabled={currentPage === totalPages}
                                                                >
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Modal de Imagen */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                        <img
                            src={selectedImage}
                            alt="Ticket"
                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Barra de acciones en lote */}
            {selectedTickets.length > 0 && (
                <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl animate-in slide-in-from-bottom duration-300">
                    <Card className="shadow-2xl border-2">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-4">
                                <span className="font-semibold text-sm">
                                    {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''} seleccionado{selectedTickets.length !== 1 ? 's' : ''}
                                </span>

                                <div className="h-6 w-px bg-border" />

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkExport}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar
                                </Button>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTickets([])}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AdminLayout>
    )
}


