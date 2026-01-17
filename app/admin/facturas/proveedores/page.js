'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import {
    Building2,
    Plus,
    Search,
    Phone,
    Mail,
    MapPin,
    FileText,
    X,
    Tag
} from 'lucide-react'

const CATEGORIAS = {
    helados: { label: 'Helados', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ingredientes: { label: 'Ingredientes', color: 'text-green-500', bg: 'bg-green-500/10' },
    packaging: { label: 'Packaging', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    servicios: { label: 'Servicios', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    mantenimiento: { label: 'Mantenimiento', color: 'text-red-500', bg: 'bg-red-500/10' },
    otros: { label: 'Otros', color: 'text-gray-500', bg: 'bg-gray-500/10' }
}

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

    const [formData, setFormData] = useState({
        nombre: '',
        nif: '',
        telefono: '',
        email: '',
        direccion: '',
        categoria: 'otros',
        notas: ''
    })

    useEffect(() => {
        cargarProveedores()
    }, [categoriaFiltro])

    const cargarProveedores = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()

            if (categoriaFiltro !== 'todas') {
                params.append('categoria', categoriaFiltro)
            }

            const response = await fetch(`/api/proveedores?${params}`)
            if (response.ok) {
                const data = await response.json()
                setProveedores(data.proveedores)
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setShowModal(false)
                setFormData({
                    nombre: '',
                    nif: '',
                    telefono: '',
                    email: '',
                    direccion: '',
                    categoria: 'otros',
                    notas: ''
                })
                cargarProveedores()
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al crear proveedor')
        }
    }

    const proveedoresFiltrados = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.nif && p.nif.toLowerCase().includes(busqueda.toLowerCase()))
    )

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-b from-background to-muted/20 backdrop-blur-xl border-b border-border/50"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight">Proveedores</h1>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {proveedores.length} registrados
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all font-semibold text-sm shadow-sm"
                                style={{ boxShadow: '0 1px 2px rgba(59, 130, 246, 0.3)' }}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nuevo</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    {/* Búsqueda y Filtros */}
                    <div className="mb-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o NIF..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setCategoriaFiltro('todas')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${categoriaFiltro === 'todas'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-muted/50 border border-border/50'
                                    }`}
                            >
                                Todas
                            </button>
                            {Object.entries(CATEGORIAS).map(([key, cat]) => (
                                <button
                                    key={key}
                                    onClick={() => setCategoriaFiltro(key)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${categoriaFiltro === key
                                        ? `${cat.bg} ${cat.color} border-2 border-current`
                                        : 'bg-muted/50 border border-border/50'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de Proveedores */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-sm text-muted-foreground">Cargando proveedores...</p>
                        </div>
                    ) : proveedoresFiltrados.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay proveedores</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {proveedoresFiltrados.map((proveedor) => {
                                const categoria = CATEGORIAS[proveedor.categoria] || CATEGORIAS.otros
                                return (
                                    <div
                                        key={proveedor.id}
                                        className="p-5 rounded-2xl bg-gradient-to-b from-background to-muted/20 border border-border/50 hover:shadow-md transition-all"
                                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${categoria.color} ${categoria.bg}`}>
                                                {categoria.label}
                                            </div>
                                            {proveedor._count?.facturas > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <FileText className="w-3 h-3" />
                                                    <span>{proveedor._count.facturas}</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-lg tracking-tight mb-3">{proveedor.nombre}</h3>

                                        <div className="space-y-2">
                                            {proveedor.nif && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Tag className="w-4 h-4 flex-shrink-0" />
                                                    <span className="font-medium">{proveedor.nif}</span>
                                                </div>
                                            )}
                                            {proveedor.telefono && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                                    <span>{proveedor.telefono}</span>
                                                </div>
                                            )}
                                            {proveedor.email && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{proveedor.email}</span>
                                                </div>
                                            )}
                                            {proveedor.direccion && (
                                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span className="line-clamp-2">{proveedor.direccion}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Nuevo Proveedor */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-lg bg-background rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            style={{ boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                            {/* Header */}
                            <div className="p-6 border-b border-border/50 sticky top-0 bg-background z-10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold tracking-tight">Nuevo Proveedor</h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-8 h-8 rounded-full hover:bg-muted/50 active:bg-muted flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Nombre del proveedor"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">NIF/CIF</label>
                                        <input
                                            type="text"
                                            value={formData.nif}
                                            onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="B12345678"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Teléfono</label>
                                        <input
                                            type="tel"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="600 123 456"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="contacto@proveedor.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Categoría *</label>
                                    <select
                                        required
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {Object.entries(CATEGORIAS).map(([key, cat]) => (
                                            <option key={key} value={key}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Dirección</label>
                                    <textarea
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                        rows="2"
                                        placeholder="Calle, número, ciudad..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Notas</label>
                                    <textarea
                                        value={formData.notas}
                                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                        rows="3"
                                        placeholder="Notas adicionales..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-border/50 font-semibold hover:bg-muted/50 active:scale-95 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 active:scale-95 transition-all"
                                    >
                                        Crear Proveedor
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
