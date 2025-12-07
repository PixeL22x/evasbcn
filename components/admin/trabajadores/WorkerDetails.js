"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Switch } from "@/components/ui/switch"
import { Save, X, Upload, FileText, Trash2, Calculator, Calendar, Briefcase } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

export function WorkerDetails({ trabajador, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState("privado")
    const [saving, setSaving] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        // Public
        nombre: trabajador.nombre || "",
        password: "", // Only for updates
        activo: trabajador.activo ?? true,
        cargo: trabajador.cargo || "empleado",

        // Private (RRHH)
        email: trabajador.email || "",
        telefono: trabajador.telefono || "",
        direccion: trabajador.direccion || "",
        dni: trabajador.dni || "",
        nss: trabajador.nss || "",
        iban: trabajador.iban || "",
        salarioHora: trabajador.salarioHora || 0,
        notasAdmin: trabajador.notasAdmin || "",
        fechaBaja: trabajador.fechaBaja || null // Explicit baja date
    })

    // Documents State
    const [documentos, setDocumentos] = useState([])
    const [loadingDocs, setLoadingDocs] = useState(false)
    const [uploadingDoc, setUploadingDoc] = useState(false)

    // Payroll State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
    const [payrollData, setPayrollData] = useState({
        horasTeoricas: 0,
        ajusteHoras: 0,
        ajusteDinero: 0,
        totalPagar: 0
    })

    useEffect(() => {
        if (activeTab === "documentos") {
            fetchDocumentos()
        }
    }, [activeTab, trabajador.id])

    useEffect(() => {
        if (activeTab === "nominas") {
            calculatePayroll()
        }
    }, [selectedMonth, formData.salarioHora, activeTab])

    // --- API Handlers ---

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Validate ID exists
        if (!trabajador?.id) {
            alert("Error: ID del trabajador no disponible")
            console.error("Trabajador object:", trabajador)
            setSaving(false)
            return
        }

        console.log("Updating worker with ID:", trabajador.id)
        console.log("Form data:", formData)

        try {
            const response = await fetch(`/api/trabajadores/${trabajador.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const updatedWorker = await response.json()
                onUpdate(updatedWorker.trabajador)
                alert("Datos actualizados correctamente")
            } else {
                const errorData = await response.json()
                console.error("Error response:", errorData)
                alert(`Error al actualizar: ${errorData.error || 'Error desconocido'}`)
            }
        } catch (error) {
            console.error("Error updating worker:", error)
            alert("Error al guardar cambios: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    const fetchDocumentos = async () => {
        setLoadingDocs(true)
        try {
            const res = await fetch(`/api/trabajadores/${trabajador.id}/documentos`)
            if (res.ok) {
                const data = await res.json()
                setDocumentos(data.documentos || [])
            }
        } catch (error) {
            console.error("Error fetching docs:", error)
        } finally {
            setLoadingDocs(false)
        }
    }

    const handleUploadDoc = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploadingDoc(true)
        try {
            // 1. Upload to Cloudinary/Server
            const uploadFormData = new FormData()
            uploadFormData.append("file", file)
            uploadFormData.append("folder", "evas-barcelona/documentos")

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadFormData
            })

            const uploadData = await uploadRes.json()

            if (!uploadRes.ok) throw new Error(uploadData.error || "Error subiendo archivo")

            // 2. Register Document in DB
            const docRes = await fetch(`/api/trabajadores/${trabajador.id}/documentos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: file.name,
                    url: uploadData.url,
                    tipo: file.type.split("/")[1] || "file",
                    categoria: "otros" // Could allow selection
                })
            })

            if (docRes.ok) {
                fetchDocumentos()
                alert("Documento subido correctamente")
            }
        } catch (error) {
            console.error("Error uploading doc:", error)
            alert("Error al subir el documento")
        } finally {
            setUploadingDoc(false)
        }
    }

    const handleDeleteDoc = async (docId) => {
        if (!confirm("¿Eliminar este documento permanentemente?")) return

        try {
            const res = await fetch(`/api/trabajadores/${trabajador.id}/documentos?docId=${docId}`, {
                method: "DELETE"
            })

            if (res.ok) {
                fetchDocumentos()
            }
        } catch (error) {
            console.error("Error deleting doc:", error)
        }
    }

    // --- Logic Helpers ---

    const calculatePayroll = async () => {
        const [year, month] = selectedMonth.split('-')

        try {
            const res = await fetch(`/api/nominas/calculo?trabajadorId=${trabajador.id}&mes=${month}&anio=${year}`)
            if (res.ok) {
                const data = await res.json()

                const pricePerHour = parseFloat(formData.salarioHora) || 0
                // Use planned hours for estimation (no fichaje system)
                const total = data.horasPlanificadas * pricePerHour

                setPayrollData(prev => ({
                    ...prev,
                    horasTeoricas: data.horasPlanificadas,
                    totalPagar: total
                }))
            }
        } catch (error) {
            console.error("Error calculating payroll", error)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border-none ring-1 ring-white/10">
                <div className="h-full flex flex-col md:flex-row">

                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 bg-muted/10 border-r dark:bg-muted/5 p-4 flex flex-col gap-2 overflow-y-auto">
                        <div className="mb-6 px-2">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-3">
                                {trabajador.nombre.charAt(0)}
                            </div>
                            <h2 className="font-semibold text-lg leading-tight">{trabajador.nombre}</h2>
                            <p className="text-sm text-muted-foreground mt-1 capitalize">{formData.cargo}</p>
                            <div className="mt-2 text-xs">
                                <Badge variant={formData.activo ? "success" : "destructive"} className={`font-normal ${formData.activo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                    {formData.activo ? "● Activo" : "● Inactivo"}
                                </Badge>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {[
                                { id: "general", label: "General", icon: <Briefcase className="w-4 h-4" /> },
                                { id: "privado", label: "Datos Privados", icon: <Save className="w-4 h-4" /> },
                                { id: "documentos", label: "Documentación", icon: <FileText className="w-4 h-4" /> },
                                { id: "nominas", label: "Nóminas", icon: <Calculator className="w-4 h-4" /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === tab.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto px-2 pt-4 border-t">
                            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={onClose}>
                                <X className="mr-2 h-4 w-4" /> Cerrar
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight">
                                    {activeTab === "general" && "Información General"}
                                    {activeTab === "privado" && "Datos Confidenciales (RRHH)"}
                                    {activeTab === "documentos" && "Gestión Documental"}
                                    {activeTab === "nominas" && "Cálculo de Nómina"}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {activeTab === "general" && "Datos públicos y estado de la cuenta."}
                                    {activeTab === "privado" && "Información sensible visible solo para administradores."}
                                    {activeTab === "documentos" && "Repositorio de contratos, bajas y otros archivos."}
                                    {activeTab === "nominas" && "Herramienta de estimación salarial."}
                                </p>
                            </div>
                            {(activeTab === "general" || activeTab === "privado") && (
                                <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                                    {saving ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />}
                                    Guardar Cambios
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-4xl mx-auto space-y-8">

                                {activeTab === "general" && (
                                    <div className="grid gap-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Nombre Completo</Label>
                                                <Input className="bg-muted/30" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Cargo / Puesto</Label>
                                                <Input className="bg-muted/30" value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                                            <h3 className="font-semibold mb-4 flex items-center text-sm uppercase tracking-wide text-muted-foreground">
                                                Estado del Contrato
                                            </h3>
                                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-dashed">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Cuenta Activa</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formData.activo
                                                            ? "El empleado tiene acceso al sistema."
                                                            : "Acceso revocado. El empleado está de baja."}
                                                    </p>
                                                </div>
                                                <Switch checked={formData.activo} onCheckedChange={val => setFormData({ ...formData, activo: val })} />
                                            </div>

                                            {!formData.activo && formData.fechaBaja && (
                                                <div className="mt-4 p-3 bg-red-50 text-red-900 rounded-md border border-red-100 flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4" />
                                                    Fecha de baja registrada: <span className="font-medium">{formatDate(formData.fechaBaja)}</span>
                                                </div>
                                            )}

                                            <div className="mt-6 pt-6 border-t">
                                                {formData.activo ? (
                                                    <Button
                                                        variant="destructive"
                                                        className="w-full sm:w-auto"
                                                        onClick={() => {
                                                            if (confirm("¿Confirmar baja? Se registrará la fecha de hoy.")) {
                                                                setFormData({ ...formData, activo: false, fechaBaja: new Date().toISOString() })
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Tramitar Baja
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                        onClick={() => setFormData({ ...formData, activo: true, fechaBaja: null })}
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" /> Reactivar Contrato
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "privado" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <section>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider border-b pb-2">Información de Contacto</h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label>Email Personal</Label>
                                                    <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Teléfono Móvil</Label>
                                                    <Input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} placeholder="+34 600..." />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Dirección Completa</Label>
                                                    <Textarea value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} className="resize-none" rows={2} />
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider border-b pb-2">Datos Fiscales y Bancarios</h3>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label>DNI / NIE</Label>
                                                    <Input value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nº Seguridad Social</Label>
                                                    <Input value={formData.nss} onChange={e => setFormData({ ...formData, nss: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Precio Hora (€/h)</Label>
                                                    <Input type="number" step="0.5" value={formData.salarioHora} onChange={e => setFormData({ ...formData, salarioHora: e.target.value })} />
                                                </div>
                                                <div className="space-y-2 md:col-span-3">
                                                    <Label>IBAN</Label>
                                                    <Input value={formData.iban} onChange={e => setFormData({ ...formData, iban: e.target.value })} className="font-mono bg-muted/30" />
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider border-b pb-2">Notas Internas</h3>
                                            <Textarea
                                                value={formData.notasAdmin}
                                                onChange={e => setFormData({ ...formData, notasAdmin: e.target.value })}
                                                placeholder="Anotaciones privadas sobre desempeño, incidencias, etc..."
                                                className="min-h-[120px]"
                                            />
                                        </section>
                                    </div>
                                )}

                                {activeTab === "documentos" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Card className="border-dashed border-2 bg-muted/10 shadow-none">
                                            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                                <div className="p-4 rounded-full bg-background shadow-sm mb-4">
                                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-medium">Subir nuevo documento</h3>
                                                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                                                    Arrastra archivos aquí o haz clic para seleccionar. Soportado: PDF, Imágenes.
                                                </p>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id="doc-upload"
                                                        className="hidden"
                                                        onChange={handleUploadDoc}
                                                        disabled={uploadingDoc}
                                                    />
                                                    <Label htmlFor="doc-upload" className={`cursor-pointer inline-flex items-center justify-center rounded-md font-medium px-8 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/20 ${uploadingDoc ? 'opacity-50' : ''}`}>
                                                        {uploadingDoc ? "Subiendo..." : "Seleccionar Archivo"}
                                                    </Label>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="space-y-4">
                                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Archivos Recientes</h3>
                                            {loadingDocs ? (
                                                <div className="grid gap-4 md:grid-cols-3">
                                                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-lg" />)}
                                                </div>
                                            ) : documentos.length === 0 ? (
                                                <p className="text-muted-foreground text-sm italic">No hay documentos almacenados.</p>
                                            ) : (
                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                    {documentos.map(doc => (
                                                        <Card key={doc.id} className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
                                                            <CardContent className="p-4 flex items-start gap-3">
                                                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                                                    <FileText className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-sm truncate" title={doc.nombre}>{doc.nombre}</h4>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.fechaSubida)}</p>
                                                                    <a href={doc.url} target="_blank" className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                                                                        Ver Documento →
                                                                    </a>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "nominas" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border">
                                            <div>
                                                <Label className="text-muted-foreground text-xs uppercase font-bold">Periodo de Cálculo</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <Input
                                                        type="month"
                                                        value={selectedMonth}
                                                        onChange={e => setSelectedMonth(e.target.value)}
                                                        className="w-40 border-none bg-transparent p-0 h-auto font-semibold text-lg focus:ring-0 shadow-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Última actualización</p>
                                                <p className="font-medium text-sm">{new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Estimado</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-primary">{formatCurrency(payrollData.totalPagar)}</div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Basado en {payrollData.horasTeoricas?.toFixed(1) || 0}h planificadas
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">Horas Planificadas</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold">
                                                        {payrollData.horasTeoricas?.toFixed(1) || 0}h
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Según Planning del Mes
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card className="border-dashed">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Ajustes / Extras (€)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="font-mono text-lg font-bold border-muted-foreground/20 max-w-[200px]"
                                                    value={payrollData.ajusteDinero}
                                                    onChange={e => setPayrollData({ ...payrollData, ajusteDinero: e.target.value })}
                                                />
                                            </CardContent>
                                        </Card>

                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                    <Calculator className="h-4 w-4" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium text-foreground">Cálculo Provisional</p>
                                                    <p className="text-muted-foreground">Basado en horas teóricas y precio/hora actual.</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => alert("Función de exportar pendiente de implementación")}>
                                                <FileText className="mr-2 h-3.5 w-3.5" />
                                                Exportar PDF
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
