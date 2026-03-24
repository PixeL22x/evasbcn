"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/contexts/ToastContext"
import AdminLayout from '../../../components/AdminLayout'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
// Dialog de creacion — inline modal (no requiere @/components/ui/dialog)
import {
  CheckCircle2, Trash2, Plus, MoreVertical, RefreshCw,
  Clock, ListTodo, CheckCheck,
} from "lucide-react"

// ─── Config ─────────────────────────────────────────────────────────────────
const PRIORIDADES = [
  { value: "urgente", label: "🔴 Urgente",  cls: "bg-red-500/15 text-red-700 border-red-500/20" },
  { value: "alta",    label: "🟠 Alta",     cls: "bg-orange-500/15 text-orange-700 border-orange-500/20" },
  { value: "normal",  label: "🟡 Normal",   cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20" },
  { value: "baja",    label: "⚪ Baja",     cls: "bg-slate-500/15 text-slate-600 border-slate-500/20" },
]
const CATEGORIAS = [
  { value: "limpieza",      label: "🧹 Limpieza" },
  { value: "mantenimiento", label: "🔧 Mantenimiento" },
  { value: "reposicion",    label: "📦 Reposición" },
  { value: "higiene",       label: "🧼 Higiene" },
  { value: "otro",          label: "📋 Otro" },
]

function prioBadge(prioridad) {
  const cfg = PRIORIDADES.find(p => p.value === prioridad) ?? PRIORIDADES[2]
  return <Badge variant="outline" className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
}
function catLabel(cat) {
  return CATEGORIAS.find(c => c.value === cat)?.label ?? cat
}
function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

// ─── KPI card ────────────────────────────────────────────────────────────────
function Kpi({ icon: Icon, label, value, border }) {
  return (
    <Card className={`border-l-4 ${border}`}>
      <CardContent className="pt-3 pb-3 flex items-center gap-2 sm:gap-3">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tarea card ──────────────────────────────────────────────────────────────
function TareaCard({ tarea, onComplete, onDelete, onReopen }) {
  const completada = tarea.estado === "completada"
  return (
    <div className={`rounded-xl border p-4 transition-all ${completada ? "opacity-60 bg-muted/30" : "bg-card"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${
          completada ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
        }`}>
          {catLabel(tarea.categoria)?.split(" ")[0] ?? "📋"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-sm leading-snug ${completada ? "line-through text-muted-foreground" : ""}`}>
              {tarea.titulo}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {!completada ? (
                  <DropdownMenuItem onClick={() => onComplete(tarea.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Marcar hecha
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReopen(tarea.id)}>
                    <RefreshCw className="mr-2 h-4 w-4 text-blue-500" /> Reabrir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(tarea.id)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {tarea.descripcion && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tarea.descripcion}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {prioBadge(tarea.prioridad)}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              👤 {tarea.trabajador?.nombre}
            </Badge>
            {tarea.fechaLimite && (
              <Badge variant="outline" className={`text-xs ${
                !completada && new Date(tarea.fechaLimite) < new Date()
                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                  : "text-muted-foreground"
              }`}>
                📅 {fmtDate(tarea.fechaLimite)}
              </Badge>
            )}
            {completada && tarea.completadaAt && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                ✓ {fmtDate(tarea.completadaAt)}
              </Badge>
            )}
          </div>

          {completada && tarea.notasWorker && (
            <p className="text-xs italic text-muted-foreground mt-1.5 border-l-2 border-emerald-400 pl-2">
              "{tarea.notasWorker}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create dialog ────────────────────────────────────────────────────────────
function CreateDialog({ open, onClose, workers, onCreated }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    titulo: "", descripcion: "", categoria: "limpieza",
    prioridad: "normal", trabajadorId: "", fechaLimite: "",
    notificarTelegram: true,  // activo por defecto
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.trabajadorId) {
      toast({ title: "Completa título y trabajador", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const r = await fetch("/api/tareas-asignadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, creadaPor: "Admin" })
      })
      if (r.ok) {
        toast({ title: "✅ Tarea creada" })
        setForm({ titulo: "", descripcion: "", categoria: "limpieza", prioridad: "normal", trabajadorId: "", fechaLimite: "", notificarTelegram: true })
        onCreated()
        onClose()
      } else {
        const e = await r.json()
        toast({ title: e.error ?? "Error al crear tarea", variant: "destructive" })
      }
    } finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      {/* mb-16 sm:mb-0 — keeps the modal above the bottom nav on mobile */}
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border overflow-y-auto mb-16 sm:mb-0"
        style={{ maxHeight: 'calc(100vh - 8rem)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <h2 className="text-base font-bold">📋 Nueva tarea asignada</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80">×</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título *</label>
            <input
              value={form.titulo} onChange={e => set("titulo", e.target.value)}
              placeholder="Limpiar paredes zona exposición…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          {/* Descripción */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea
              value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
              rows={2} placeholder="Detalles adicionales…"
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          {/* Row: Categoría + Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Categoría</label>
              <select value={form.categoria} onChange={e => set("categoria", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prioridad</label>
              <select value={form.prioridad} onChange={e => set("prioridad", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          {/* Row: Trabajador + Fecha límite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Trabajador *</label>
              <select value={form.trabajadorId} onChange={e => set("trabajadorId", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="">— Seleccionar —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha límite</label>
              <input type="date" value={form.fechaLimite} onChange={e => set("fechaLimite", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            </div>
          </div>
          {/* Toggle Telegram */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <input type="checkbox" checked={form.notificarTelegram} onChange={e => set("notificarTelegram", e.target.checked)}
              className="rounded w-4 h-4 accent-primary" />
            <div>
              <p className="text-sm font-medium">Notificar al trabajador</p>
              <p className="text-xs text-muted-foreground">El worker recibirá un mensaje con los detalles</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando…" : "✅ Crear tarea"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TareasAdminPage() {
  const { toast } = useToast()
  const [tareas, setTareas] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("pendiente")  // pendiente | all | completada
  const [filtroWorker, setFiltroWorker] = useState("all")

  const fetchTareas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== "all") params.set("estado", filtroEstado)
      if (filtroWorker !== "all") params.set("trabajadorId", filtroWorker)
      const r = await fetch(`/api/tareas-asignadas?${params}`)
      if (r.ok) setTareas(await r.json())
    } catch { toast({ title: "Error cargando tareas", variant: "destructive" }) }
    finally { setLoading(false) }
  }, [filtroEstado, filtroWorker])

  useEffect(() => { fetchTareas() }, [fetchTareas])

  useEffect(() => {
    fetch("/api/trabajadores")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setWorkers((d.trabajadores ?? []).filter(w => w.activo)))
  }, [])

  const doAction = async (id, body) => {
    const r = await fetch(`/api/tareas-asignadas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    if (r.ok) fetchTareas()
    else toast({ title: "Error al actualizar", variant: "destructive" })
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta tarea?")) return
    const r = await fetch(`/api/tareas-asignadas/${id}`, { method: "DELETE" })
    if (r.ok) { toast({ title: "Tarea eliminada" }); fetchTareas() }
    else toast({ title: "Error al eliminar", variant: "destructive" })
  }

  const pendientes   = tareas.filter(t => t.estado === "pendiente").length
  const completadas  = tareas.filter(t => t.estado === "completada").length
  const vencidas     = tareas.filter(t => t.estado === "pendiente" && t.fechaLimite && new Date(t.fechaLimite) < new Date()).length

  return (
    <AdminLayout>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold md:text-2xl">📋 Tareas Asignadas</h1>
                <p className="text-sm text-muted-foreground">Asigna y supervisa tareas operativas a tu equipo</p>
              </div>
              <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1.5" /> Nueva tarea
              </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <Kpi icon={ListTodo}    label="Pendientes"  value={pendientes}  border="border-l-blue-500" />
              <Kpi icon={CheckCheck}  label="Completadas" value={completadas} border="border-l-emerald-500" />
              <Kpi icon={Clock}       label="Vencidas"    value={vencidas}    border="border-l-red-500" />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 items-center overflow-x-auto pb-1 scrollbar-none">
              {/* Estado toggle */}
              <div className="flex rounded-lg border overflow-hidden text-sm h-9 flex-shrink-0">
                {[["pendiente","Pendientes","Pend."],["all","Todas","Todas"],["completada","Completadas","Comp."]].map(([v, lFull, lShort]) => (
                  <button key={v} onClick={() => setFiltroEstado(v)}
                    className={`px-2.5 sm:px-3 h-full transition-colors whitespace-nowrap ${filtroEstado === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    <span className="sm:hidden">{lShort}</span>
                    <span className="hidden sm:inline">{lFull}</span>
                  </button>
                ))}
              </div>
              {/* Worker filter */}
              <select value={filtroWorker} onChange={e => setFiltroWorker(e.target.value)}
                className="rounded-lg border px-2 sm:px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background flex-shrink-0 max-w-[160px] sm:max-w-none">
                <option value="all">Todos</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
              </select>
              <Button variant="outline" size="sm" className="h-9 flex-shrink-0" onClick={fetchTareas}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border p-4 flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tareas.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">No hay tareas {filtroEstado !== "all" ? `${filtroEstado}s` : ""} para este filtro</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Crear primera tarea
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tareas.map(tarea => (
                  <TareaCard key={tarea.id} tarea={tarea}
                    onComplete={id => doAction(id, { estado: "completada" })}
                    onReopen={id => doAction(id, { estado: "pendiente" })}
                    onDelete={handleDelete} />
                ))}
              </div>
            )}

          </div>
        </SidebarInset>
      </SidebarProvider>

      <CreateDialog open={showCreate} onClose={() => setShowCreate(false)} workers={workers} onCreated={fetchTareas} />
    </AdminLayout>
  )
}
