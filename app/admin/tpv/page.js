"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from '@/components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  ShoppingCart,
  Package,
  Key,
  Plus,
  Pencil,
  Trash2,
  Ban,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  TrendingUp,
  Receipt,
  CreditCard,
} from "lucide-react"

const CATEGORIAS = ["helados", "bebidas", "postres", "churros", "otros"]
const CATEGORIA_EMOJIS = {
  helados: "🍦",
  bebidas: "🥤",
  postres: "🧁",
  churros: "🥐",
  otros: "🛍️",
}

function formatCurrency(n) {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatHora(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
}

// ─── Pestaña de Ventas ───────────────────────────────────────────────────────
function PestanaVentas() {
  const [ventas, setVentas] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [anulando, setAnulando] = useState(null)
  const [ventaDetalle, setVentaDetalle] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resVentas, resStats] = await Promise.all([
        fetch("/api/tpv/ventas?hoy=true&limit=100"),
        fetch("/api/tpv/stats"),
      ])
      const dataVentas = await resVentas.json()
      const dataStats = await resStats.json()
      setVentas(dataVentas.ventas || [])
      setStats(dataStats)
    } catch (e) {
      console.error("Error cargando ventas TPV:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Refresco automático cada 60 segundos
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleAnular = async (ventaId) => {
    if (!confirm("¿Anular esta venta? Esta acción no se puede deshacer.")) return
    setAnulando(ventaId)
    try {
      const res = await fetch(`/api/tpv/ventas/${ventaId}`, { method: "DELETE" })
      if (res.ok) await fetchData()
      else alert("Error al anular la venta")
    } catch {
      alert("Error de conexión")
    } finally {
      setAnulando(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-violet-500/10 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total hoy</p>
                <p className="text-2xl font-bold">
                  {stats ? `€${formatCurrency(stats.totalHoy)}` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transacciones</p>
                <p className="text-2xl font-bold">{stats?.numVentas ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ticket medio</p>
                <p className="text-2xl font-bold">
                  {stats ? `€${formatCurrency(stats.ticketMedio)}` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de refresco */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Ventas de hoy ({ventas.length})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Lista de ventas */}
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
          <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay ventas registradas hoy desde el TPV</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ventas.map((venta) => (
            <div
              key={venta.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground font-mono w-12">
                  {formatHora(venta.createdAt)}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {venta.lineas?.map((l) => `${l.cantidad}× ${l.nombreProducto}`).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {venta.lineas?.length} {venta.lineas?.length === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-sm">€{formatCurrency(venta.total)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => setVentaDetalle(venta)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleAnular(venta.id)}
                  disabled={anulando === venta.id}
                >
                  {anulando === venta.id ? (
                    <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle venta */}
      <Dialog open={!!ventaDetalle} onOpenChange={() => setVentaDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de venta · {ventaDetalle && formatHora(ventaDetalle.createdAt)}</DialogTitle>
          </DialogHeader>
          {ventaDetalle && (
            <div className="space-y-3">
              {ventaDetalle.lineas?.map((linea, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {linea.cantidad}× {linea.nombreProducto}
                  </span>
                  <span className="text-muted-foreground">€{formatCurrency(linea.subtotal)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>TOTAL</span>
                <span>€{formatCurrency(ventaDetalle.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">💳 Pago con tarjeta</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVentaDetalle(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Pestaña de Carta (catálogo productos) ────────────────────────────────────
function PestanaCarta() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null) // producto que se edita
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: "", categoria: "helados", precio: "", emoji: "", descripcion: "", orden: "0", imageUrl: ""
  })

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tpv/productos?includeInactive=true")
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Error cargando productos TPV:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProductos() }, [fetchProductos])

  const resetForm = () => {
    setForm({ nombre: "", categoria: "helados", precio: "", emoji: "", descripcion: "", orden: "0", imageUrl: "" })
    setEditando(null)
    setShowForm(false)
  }

  const handleEdit = (producto) => {
    setEditando(producto)
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio.toString(),
      emoji: producto.emoji || "",
      descripcion: producto.descripcion || "",
      orden: producto.orden?.toString() || "0",
      imageUrl: producto.imageUrl || "",
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precio: parseFloat(form.precio),
        emoji: form.emoji.trim() || null,
        descripcion: form.descripcion.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        orden: parseInt(form.orden) || 0,
      }

      let res
      if (editando) {
        res = await fetch(`/api/tpv/productos/${editando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/tpv/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      if (res.ok) {
        await fetchProductos()
        resetForm()
      } else {
        const err = await res.json()
        alert(err.error || "Error al guardar")
      }
    } catch {
      alert("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (producto) => {
    try {
      await fetch(`/api/tpv/productos/${producto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !producto.activo }),
      })
      await fetchProductos()
    } catch {
      alert("Error al cambiar estado")
    }
  }

  // Agrupar por categoría
  const porCategoria = CATEGORIAS.reduce((acc, cat) => {
    acc[cat] = productos.filter((p) => p.categoria === cat)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Carta del TPV ({productos.filter(p => p.activo).length} activos)
        </h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Añadir producto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        CATEGORIAS.map((cat) => (
          porCategoria[cat]?.length > 0 && (
            <div key={cat}>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <span>{CATEGORIA_EMOJIS[cat]}</span>
                <span>{cat}</span>
                <Badge variant="outline" className="text-xs normal-case font-normal">
                  {porCategoria[cat].length}
                </Badge>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {porCategoria[cat].map((producto) => (
                  <div
                    key={producto.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      producto.activo
                        ? "bg-card border-border"
                        : "bg-muted/30 border-border/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{producto.emoji || CATEGORIA_EMOJIS[cat]}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{producto.nombre}</p>
                        <p className="text-violet-500 font-bold text-sm">€{formatCurrency(producto.precio)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(producto)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${producto.activo ? "text-muted-foreground" : "text-green-500"}`}
                        onClick={() => handleToggleActivo(producto)}
                        title={producto.activo ? "Desactivar" : "Activar"}
                      >
                        {producto.activo ? <Trash2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))
      )}

      {productos.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="mb-3">La carta está vacía. Añade tu primer producto.</p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Añadir producto
          </Button>
        </div>
      )}

      {/* Modal crear/editar producto */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Bola de helado"
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger id="categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORIA_EMOJIS[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="precio">Precio (€) *</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  placeholder="1.50"
                  required
                />
              </div>
              <div>
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="🍦"
                  maxLength={4}
                />
              </div>
              <div>
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  min="0"
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                />
                {form.imageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded-lg border border-border"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <span className="text-xs text-muted-foreground">Vista previa</span>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Input
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción breve"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Pestaña de Configuración / API ──────────────────────────────────────────
function PestanaConfig() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [copiado, setCopiado] = useState(null)
  const apiKey = "evasbcn_tpv_2026_secret"
  const apiUrl = typeof window !== "undefined" ? window.location.origin : "https://evasbcn-6lq5.vercel.app"

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id)
      setTimeout(() => setCopiado(null), 2000)
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-5 w-5 text-violet-500" />
            API Key del TPV
          </CardTitle>
          <CardDescription>
            Configura esta clave en la variable de entorno <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_TPV_API_KEY</code> del proyecto TPV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={apiKeyVisible ? apiKey : "•".repeat(apiKey.length)}
              className="font-mono text-sm"
            />
            <Button variant="ghost" size="icon" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
              {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => copiar(apiKey, "key")}>
              {copiado === "key" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🌐 URL de la API
          </CardTitle>
          <CardDescription>
            Configura esta URL en la variable <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> del proyecto TPV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input readOnly value={apiUrl} className="font-mono text-sm" />
            <Button variant="ghost" size="icon" onClick={() => copiar(apiUrl, "url")}>
              {copiado === "url" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardHeader>
          <CardTitle className="text-base">📲 Endpoints disponibles para el TPV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { method: "GET", path: "/api/tpv/productos", desc: "Catálogo de productos (sin auth)" },
            { method: "POST", path: "/api/tpv/ventas", desc: "Registrar venta (requiere x-api-key)" },
            { method: "GET", path: "/api/tpv/ventas?hoy=true", desc: "Historial ventas del día (sin auth)" },
            { method: "GET", path: "/api/tpv/stats", desc: "Estadísticas del día (sin auth)" },
          ].map((ep, i) => (
            <div key={i} className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={`shrink-0 text-xs font-mono ${
                  ep.method === "GET"
                    ? "border-blue-500/50 text-blue-400"
                    : "border-green-500/50 text-green-400"
                }`}
              >
                {ep.method}
              </Badge>
              <div className="min-w-0">
                <code className="text-xs text-foreground">{ep.path}</code>
                <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 .env.local para el proyecto TPV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`NEXT_PUBLIC_API_URL=${apiUrl}
NEXT_PUBLIC_TPV_API_KEY=${apiKey}`}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copiar(`NEXT_PUBLIC_API_URL=${apiUrl}\nNEXT_PUBLIC_TPV_API_KEY=${apiKey}`, "env")}
            >
              {copiado === "env" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function TPVAdminPage() {
  return (
    <AdminLayout>
      <SidebarProvider
        style={{ "--sidebar-width": "19rem", "--header-height": "4rem" }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">TPV Auxiliar</h1>
                      <p className="text-muted-foreground text-sm">
                        Gestión de la tablet de ventas · Evas Barcelona
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="ventas">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                      <TabsTrigger value="ventas" className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Ventas
                      </TabsTrigger>
                      <TabsTrigger value="carta" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Carta
                      </TabsTrigger>
                      <TabsTrigger value="config" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        API
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ventas" className="mt-6">
                      <PestanaVentas />
                    </TabsContent>

                    <TabsContent value="carta" className="mt-6">
                      <PestanaCarta />
                    </TabsContent>

                    <TabsContent value="config" className="mt-6">
                      <PestanaConfig />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
