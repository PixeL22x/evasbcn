'use client'

import { useState, useEffect } from 'react'
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
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    Calendar as CalendarIcon,
    Euro,
    ImageIcon,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    Trash2,
    TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function TicketsPage() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [editingDateId, setEditingDateId] = useState(null)

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

    useEffect(() => {
        fetchTickets()
    }, [])

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
                                            <h1 className="text-3xl font-bold">Tickets del Día</h1>
                                            <p className="text-muted-foreground">
                                                Gestión y visualización de tickets escaneados
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => window.location.href = '/admin/tickets/analytics'}>
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                Analytics
                                            </Button>
                                            <Button onClick={fetchTickets}>
                                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                                Actualizar
                                            </Button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                            <strong className="font-bold">Error:</strong>
                                            <span className="block sm:inline"> {error}</span>
                                        </div>
                                    )}

                                    {loading && tickets.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="mt-2 text-muted-foreground">Cargando tickets...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {tickets.map((ticket) => (
                                                <Card key={ticket.id} className="flex flex-col">
                                                    {/* Header Card */}
                                                    <CardHeader className="border-b">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <CalendarIcon className="w-4 h-4" />
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
                                                                        className="text-sm font-medium px-2 py-1 rounded border border-primary"
                                                                    />
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setEditingDateId(ticket.id)}
                                                                        className="text-sm font-medium capitalize hover:text-primary transition-colors"
                                                                    >
                                                                        {ticket.fecha
                                                                            ? format(new Date(ticket.fecha), "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })
                                                                            : 'Fecha desconocida'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <StatusBadge status={ticket.status} />
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
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
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
        </AdminLayout>
    )
}

function StatusBadge({ status }) {
    const statusConfig = {
        procesando: { label: 'Procesando', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        completado: { label: 'Completado', icon: CheckCircle2, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        error: { label: 'Error', icon: AlertCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    }

    const config = statusConfig[status] || statusConfig.procesando
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    )
}
