'use client'

import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import {
    StickyNote,
    Plus,
    Share2,
    Calendar,
    AlertCircle,
    Clock,
    User,
    X,
    Edit2,
    ChevronRight,
    AlertTriangle,
    FileText,
    Users
} from 'lucide-react'

const CATEGORIAS = {
    equipo: { label: 'Equipo', color: 'bg-blue-500', icon: Users },
    incidencia: { label: 'Incidencias', color: 'bg-red-500', icon: AlertTriangle },
    general: { label: 'General', color: 'bg-gray-500', icon: FileText }
}

const PRIORIDADES = {
    baja: { label: 'Baja', color: 'text-gray-500' },
    normal: { label: 'Normal', color: 'text-blue-500' },
    alta: { label: 'Alta', color: 'text-red-500' }
}

export default function AdminNotesWidget() {
    const [notas, setNotas] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingNota, setEditingNota] = useState(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [formData, setFormData] = useState({
        titulo: '',
        contenido: '',
        categoria: 'general',
        prioridad: 'normal',
        fecha: new Date().toISOString().split('T')[0],
        trabajadorRelacionado: ''
    })

    // Obtener mes y año actual
    const now = new Date()
    const [mesActual] = useState(now.getMonth() + 1)
    const [añoActual] = useState(now.getFullYear())

    useEffect(() => {
        cargarNotas()
    }, [])

    const cargarNotas = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/notas?mes=${mesActual}&año=${añoActual}`)
            if (response.ok) {
                const data = await response.json()
                setNotas(data.slice(0, 2)) // Solo mostrar las 2 más recientes en el widget
            }
        } catch (error) {
            console.error('Error al cargar notas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const url = editingNota
                ? `/api/admin/notas/${editingNota.id}`
                : '/api/admin/notas'

            const method = editingNota ? 'PATCH' : 'POST'

            console.log('Enviando:', { method, url, formData })

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            console.log('Respuesta:', response.status, response.statusText)

            if (response.ok) {
                await cargarNotas()
                cerrarModal()
            } else {
                const errorData = await response.json()
                console.error('Error del servidor:', errorData)
                alert(`Error: ${errorData.error || 'No se pudo guardar la nota'}`)
            }
        } catch (error) {
            console.error('Error al guardar nota:', error)
            alert('Error al guardar la nota. Revisa la consola para más detalles.')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta nota permanentemente?')) return

        try {
            const response = await fetch(`/api/admin/notas/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                await cargarNotas()
            }
        } catch (error) {
            console.error('Error al eliminar nota:', error)
        }
    }

    const abrirModal = (nota = null) => {
        if (nota) {
            setEditingNota(nota)
            setFormData({
                titulo: nota.titulo,
                contenido: nota.contenido,
                categoria: nota.categoria,
                prioridad: nota.prioridad,
                fecha: new Date(nota.fecha).toISOString().split('T')[0],
                trabajadorRelacionado: nota.trabajadorRelacionado || ''
            })
        } else {
            setEditingNota(null)
            setFormData({
                titulo: '',
                contenido: '',
                categoria: 'general',
                prioridad: 'normal',
                fecha: new Date().toISOString().split('T')[0],
                trabajadorRelacionado: ''
            })
        }
        setShowModal(true)
    }

    const cerrarModal = () => {
        setShowModal(false)
        setEditingNota(null)
        setShowAdvanced(false)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleExportPDF = () => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setFont(undefined, 'bold')
        doc.text('Notas Administrativas', 20, 20)

        doc.setFontSize(12)
        doc.setFont(undefined, 'normal')
        const mesNombre = new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        doc.text(mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1), 20, 30)

        // Line separator
        doc.setLineWidth(0.5)
        doc.line(20, 35, 190, 35)

        let y = 45

        if (notas.length === 0) {
            doc.setFontSize(11)
            doc.text('No hay notas para este mes', 20, y)
        } else {
            notas.forEach((nota, index) => {
                const categoria = CATEGORIAS[nota.categoria]
                const prioridad = PRIORIDADES[nota.prioridad]

                // Check if we need a new page
                if (y > 250) {
                    doc.addPage()
                    y = 20
                }

                // Category badge
                doc.setFontSize(10)
                doc.setFont(undefined, 'bold')
                doc.text(`[${categoria.label}]`, 20, y)

                // Title
                doc.setFontSize(14)
                doc.setFont(undefined, 'bold')
                const titleLines = doc.splitTextToSize(nota.titulo, 160)
                doc.text(titleLines, 20, y + 7)
                y += titleLines.length * 7 + 3

                // Metadata
                doc.setFontSize(9)
                doc.setFont(undefined, 'normal')
                doc.setTextColor(100, 100, 100)
                doc.text(`Fecha: ${formatearFecha(nota.fecha)}`, 20, y)
                y += 5

                if (nota.prioridad === 'alta') {
                    doc.text(`Prioridad: ${prioridad.label}`, 20, y)
                    y += 5
                }

                if (nota.trabajadorRelacionado) {
                    doc.text(`Trabajador: ${nota.trabajadorRelacionado}`, 20, y)
                    y += 5
                }

                // Content
                doc.setTextColor(0, 0, 0)
                doc.setFontSize(10)
                const contentLines = doc.splitTextToSize(nota.contenido, 170)
                doc.text(contentLines, 20, y + 3)
                y += contentLines.length * 5 + 10

                // Separator line between notes
                if (index < notas.length - 1) {
                    doc.setDrawColor(200, 200, 200)
                    doc.setLineWidth(0.3)
                    doc.line(20, y, 190, y)
                    y += 8
                }
            })
        }

        // Save PDF
        const fileName = `notas-${mesNombre.replace(/ /g, '-').toLowerCase()}.pdf`
        doc.save(fileName)
    }

    return (
        <div className="bg-card rounded-2xl border-0 shadow-sm overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
            {/* Header - iOS Style */}
            <div className="px-4 py-3 bg-gradient-to-b from-background to-muted/30">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <StickyNote className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-base tracking-tight">Notas del Mes</h3>
                            <span className="text-xs text-muted-foreground font-medium">
                                {new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-blue-500 text-blue-500 rounded-full hover:bg-blue-500/10 active:scale-95 transition-all text-sm font-semibold"
                            title="Exportar a PDF"
                        >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={() => abrirModal()}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all text-sm font-semibold shadow-sm"
                            style={{ boxShadow: '0 1px 2px rgba(59, 130, 246, 0.3)' }}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nueva</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Notas - iOS Style */}
            <div className="px-4 py-3">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                ) : notas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay notas este mes</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notas.map((nota) => {
                            const categoria = CATEGORIAS[nota.categoria]
                            const prioridad = PRIORIDADES[nota.prioridad]

                            return (
                                <div
                                    key={nota.id}
                                    className="group bg-background/50 rounded-xl p-3 hover:bg-background active:bg-muted/50 transition-all touch-manipulation"
                                    style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icono de categoría - iOS Style */}
                                        <div className={`w-10 h-10 rounded-xl ${categoria.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                                            <categoria.icon className="w-5 h-5 sm:w-4 sm:h-4" />
                                        </div>

                                        {/* Contenido */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-foreground truncate tracking-tight">
                                                        {nota.titulo}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                                        {nota.contenido}
                                                    </p>
                                                </div>

                                                {/* Acciones - iOS Style */}
                                                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => abrirModal(nota)}
                                                        className="p-1.5 hover:bg-blue-500/10 active:bg-blue-500/20 rounded-lg transition-colors touch-manipulation"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(nota.id)}
                                                        className="p-1.5 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors touch-manipulation"
                                                        title="Eliminar"
                                                    >
                                                        <X className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Metadata */}
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="hidden sm:inline">{formatearFecha(nota.fecha)}</span>
                                                    <span className="sm:hidden">{new Date(nota.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                                </span>
                                                {nota.trabajadorRelacionado && (
                                                    <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                                                        <User className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{nota.trabajadorRelacionado}</span>
                                                    </span>
                                                )}
                                                {nota.prioridad === 'alta' && (
                                                    <span className={`flex items-center gap-1 ${prioridad.color} font-medium`}>
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span className="hidden sm:inline">{prioridad.label}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Ver todas - iOS Style */}
                {notas.length > 0 && (
                    <button className="w-full mt-3 py-2.5 text-sm font-semibold text-blue-500 hover:text-blue-600 active:text-blue-700 flex items-center justify-center gap-1 transition-colors touch-manipulation rounded-lg hover:bg-blue-500/5 active:bg-blue-500/10">
                        Ver todas las notas
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300" style={{ boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                        {/* Header del Modal - iOS Style */}
                        <div className="px-4 py-3 bg-gradient-to-b from-background to-muted/20 flex items-center justify-between flex-shrink-0 border-b border-border/50">
                            <h3 className="font-semibold text-lg text-foreground tracking-tight">
                                {editingNota ? 'Editar Nota' : 'Nueva Nota'}
                            </h3>
                            <button
                                onClick={cerrarModal}
                                className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 active:bg-muted rounded-full transition-colors touch-manipulation"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Formulario con scroll */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                {/* Título */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: Cambio de turno Ana - Carlos"
                                    />
                                </div>

                                {/* Contenido */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Contenido *
                                    </label>
                                    <textarea
                                        required
                                        value={formData.contenido}
                                        onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        placeholder="Describe los detalles de la nota..."
                                    />
                                </div>

                                {/* Categoría - Selección Visual */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Categoría *
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(CATEGORIAS).map(([key, cat]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, categoria: key })}
                                                className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all touch-manipulation ${formData.categoria === key
                                                    ? `${cat.color} border-transparent text-white shadow-lg`
                                                    : 'border-border bg-background hover:bg-muted'
                                                    }`}
                                            >
                                                <cat.icon className="w-7 h-7" />
                                                <span className="text-xs font-medium text-center leading-tight">
                                                    {cat.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Opciones Avanzadas - Colapsable */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''
                                            }`} />
                                        Opciones avanzadas
                                    </button>

                                    {showAdvanced && (
                                        <div className="mt-3 space-y-4 pl-6 border-l-2 border-border">
                                            {/* Prioridad */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    Prioridad
                                                </label>
                                                <div className="flex gap-2">
                                                    {Object.entries(PRIORIDADES).map(([key, pri]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, prioridad: key })}
                                                            className={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-all touch-manipulation ${formData.prioridad === key
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-border bg-background hover:bg-muted'
                                                                }`}
                                                        >
                                                            {pri.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fecha */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    Fecha del evento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.fecha}
                                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            {/* Trabajador */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    Trabajador relacionado
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.trabajadorRelacionado}
                                                    onChange={(e) => setFormData({ ...formData, trabajadorRelacionado: e.target.value })}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="Nombre del trabajador"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botones - iOS Style */}
                            <div className="flex gap-3 p-4 pb-20 sm:pb-4 border-t border-border/50 bg-background/50 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="flex-1 px-4 py-3 sm:py-2.5 border border-border/50 rounded-full hover:bg-muted/50 active:bg-muted transition-colors text-foreground font-semibold touch-manipulation"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 sm:py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all font-semibold touch-manipulation shadow-sm"
                                    style={{ boxShadow: '0 1px 2px rgba(59, 130, 246, 0.3)' }}
                                >
                                    {editingNota ? 'Actualizar' : 'Crear'} Nota
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
