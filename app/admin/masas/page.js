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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  RefreshCw, MoreVertical, CheckCircle2, Trash2,
  AlertTriangle, Clock, XCircle, ChefHat, Cake,
} from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────────────────
const BADGE = {
  ok:         { label: "En uso",            cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  proximo:    { label: "Vence hoy/mañana",  cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  caducado:   { label: "Caducado",          cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
  finalizado: { label: "Vendido ✓",         cls: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20" },
  merma:      { label: "Merma / retirado",  cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20" },
}

function estadoBadge(lote) {
  const key = lote.motivoFinalizacion ?? lote.estadoVisual ?? "ok"
  const cfg = BADGE[key] ?? BADGE.ok
  return <Badge variant="outline" className={`text-xs font-medium ${cfg.cls}`}>{cfg.label}</Badge>
}

function diasColor(lote) {
  if (lote.estadoVisual === "caducado") return "text-red-600 font-bold"
  if (lote.estadoVisual === "proximo")  return "text-amber-600 font-semibold"
  return "text-emerald-600 font-semibold"
}

function fmt(d) {
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

// ─── Acciones dropdown ──────────────────────────────────────────────────────
function AccionesMenu({ lote, tipo, onFinalizar, onEliminar }) {
  if (lote.estado !== "activo") return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onFinalizar(lote.id, "finalizado", tipo)}>
          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Marcar vendido
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFinalizar(lote.id, "merma", tipo)}>
          <XCircle className="mr-2 h-4 w-4 text-slate-500" /> Merma / retirado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEliminar(lote.id, tipo)} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar (error entrada)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Card mobile ────────────────────────────────────────────────────────────
function LoteCard({ lote, tipo, onFinalizar, onEliminar }) {
  const esMasa = tipo === "masas"
  const titulo = esMasa ? lote.tipo : lote.sabor
  const fecha  = esMasa ? lote.fechaElaboracion : lote.fechaEntrada

  const bgCard =
    lote.estado !== "activo"     ? "border-slate-200 dark:border-slate-700" :
    lote.estadoVisual === "caducado" ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" :
    lote.estadoVisual === "proximo"  ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" :
    "border-emerald-200"

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${bgCard}`}>
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border flex items-center justify-center text-lg shadow-sm">
        {esMasa ? "🧇" : "🍰"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="font-semibold capitalize truncate">{titulo}</p>
          <AccionesMenu lote={lote} tipo={tipo} onFinalizar={onFinalizar} onEliminar={onEliminar} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {estadoBadge(lote)}
          {esMasa && <span className="text-xs text-muted-foreground font-mono">#{lote.numero ?? "–"}</span>}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>📅 {fmt(fecha)}</span>
          <span>⏱ Límite: {fmt(lote.fechaLimite)}</span>
          {lote.estado === "activo" && (
            <span className={diasColor(lote)}>
              {lote.diasRestantes > 0 ? `${lote.diasRestantes} día${lote.diasRestantes !== 1 ? "s" : ""} restantes` : "¡Vencido!"}
            </span>
          )}
          <span>👤 {lote.trabajador?.nombre ?? "–"}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Table desktop ──────────────────────────────────────────────────────────
function LotesTable({ lotes, tipo, onFinalizar, onEliminar }) {
  const esMasa = tipo === "masas"
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
          <tr>
            {esMasa && <th className="px-4 py-3 text-left">Nº</th>}
            <th className="px-4 py-3 text-left">{esMasa ? "Tipo" : "Sabor"}</th>
            <th className="px-4 py-3 text-left">{esMasa ? "Elaboración" : "Entrada"}</th>
            <th className="px-4 py-3 text-left">Límite</th>
            <th className="px-4 py-3 text-left">Días</th>
            <th className="px-4 py-3 text-left">Trabajador</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {lotes.map(lote => (
            <tr key={lote.id} className="transition-colors hover:bg-muted/30">
              {esMasa && <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{lote.numero ?? "–"}</td>}
              <td className="px-4 py-3 font-semibold capitalize">{esMasa ? lote.tipo : lote.sabor}</td>
              <td className="px-4 py-3 text-muted-foreground">{fmt(esMasa ? lote.fechaElaboracion : lote.fechaEntrada)}</td>
              <td className="px-4 py-3 text-muted-foreground">{fmt(lote.fechaLimite)}</td>
              <td className="px-4 py-3">
                {lote.estado === "activo"
                  ? <span className={diasColor(lote)}>{lote.diasRestantes > 0 ? `${lote.diasRestantes}d` : "0d"}</span>
                  : "–"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{lote.trabajador?.nombre ?? "–"}</td>
              <td className="px-4 py-3">{estadoBadge(lote)}</td>
              <td className="px-4 py-3 text-right">
                <AccionesMenu lote={lote} tipo={tipo} onFinalizar={onFinalizar} onEliminar={onEliminar} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function LoteSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border p-4 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, borderColor }) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="pt-4 pb-3 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ControlProduccionPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState("masas")
  const [masas, setMasas] = useState([])
  const [tartas, setTartas] = useState([])
  const [loadingMasas, setLoadingMasas] = useState(true)
  const [loadingTartas, setLoadingTartas] = useState(true)
  const [filtro, setFiltro] = useState("activos")

  const fetchMasas = useCallback(async () => {
    setLoadingMasas(true)
    try {
      const r = await fetch(`/api/masas?includeFinalizados=${filtro === "todos"}`)
      if (r.ok) setMasas(await r.json())
    } catch { toast({ title: "Error cargando masas", variant: "destructive" }) }
    finally { setLoadingMasas(false) }
  }, [filtro])

  const fetchTartas = useCallback(async () => {
    setLoadingTartas(true)
    try {
      const r = await fetch(`/api/tartas?includeFinalizados=${filtro === "todos"}`)
      if (r.ok) setTartas(await r.json())
    } catch { toast({ title: "Error cargando tartas", variant: "destructive" }) }
    finally { setLoadingTartas(false) }
  }, [filtro])

  useEffect(() => { fetchMasas(); fetchTartas() }, [fetchMasas, fetchTartas])

  const handleFinalizar = async (id, motivo, tipo) => {
    const r = await fetch(`/api/${tipo === "masas" ? "masas" : "tartas"}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivoFinalizacion: motivo })
    })
    if (r.ok) {
      toast({ title: motivo === "merma" ? "Merma registrada" : "Marcado como vendido ✓" })
      tipo === "masas" ? fetchMasas() : fetchTartas()
    } else toast({ title: "Error al actualizar", variant: "destructive" })
  }

  const handleEliminar = async (id, tipo) => {
    if (!confirm("¿Eliminar este lote? Solo si fue un error de entrada.")) return
    const r = await fetch(`/api/${tipo === "masas" ? "masas" : "tartas"}/${id}`, { method: "DELETE" })
    if (r.ok) {
      toast({ title: "Lote eliminado" })
      tipo === "masas" ? fetchMasas() : fetchTartas()
    } else toast({ title: "Error al eliminar", variant: "destructive" })
  }

  const kpi = (arr) => ({
    activos:   arr.filter(l => l.estado === "activo").length,
    proximos:  arr.filter(l => l.estado === "activo" && l.estadoVisual === "proximo").length,
    caducados: arr.filter(l => l.estado === "activo" && l.estadoVisual === "caducado").length,
  })
  const km = kpi(masas); const kt = kpi(tartas)
  const total = {
    activos:   km.activos + kt.activos,
    proximos:  km.proximos + kt.proximos,
    caducados: km.caducados + kt.caducados,
  }

  const currentList    = tab === "masas" ? masas : tartas
  const currentLoading = tab === "masas" ? loadingMasas : loadingTartas

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
                <h1 className="text-xl font-bold md:text-2xl">🧇 Control de Producción</h1>
                <p className="text-sm text-muted-foreground">Masas (waffles & creps) y tartas en vitrina</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filtro toggle */}
                <div className="flex rounded-lg border overflow-hidden text-sm h-9">
                  {["activos", "todos"].map(f => (
                    <button key={f} onClick={() => setFiltro(f)}
                      className={`px-3 h-full capitalize transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      {f === "activos" ? "Activos" : "Todos"}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchMasas(); fetchTartas() }}>
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Actualizar
                </Button>
              </div>
            </div>

            {/* KPIs — 1 col en móvil, 3 en md */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiCard icon={Clock}         label="Lotes activos"        value={total.activos}   borderColor="border-l-emerald-500" />
              <KpiCard icon={AlertTriangle} label="Próximos a caducar"   value={total.proximos}  borderColor="border-l-amber-500" />
              <KpiCard icon={XCircle}       label="Caducados (retirar!)" value={total.caducados} borderColor="border-l-red-500" />
            </div>

            {/* Tabs — full width en móvil */}
            <div className="flex border-b">
              {[
                { key: "masas",  icon: <ChefHat className="h-4 w-4 mr-1.5" />, label: `Masas`,  count: km.activos },
                { key: "tartas", icon: <Cake   className="h-4 w-4 mr-1.5" />, label: `Tartas`, count: kt.activos },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
                  {t.icon}{t.label}
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t.count}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <Card>
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tab === "masas"
                    ? "Lotes de masa — Waffles & Creps · máx 3 días"
                    : "Lotes de tarta en vitrina fría · máx 4 días"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentLoading ? (
                  <LoteSkeleton />
                ) : currentList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-4xl mb-3">{tab === "masas" ? "🧇" : "🍰"}</p>
                    <p className="text-sm">No hay lotes registrados</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: cards */}
                    <div className="md:hidden space-y-3">
                      {currentList.map(lote => (
                        <LoteCard key={lote.id} lote={lote} tipo={tab}
                          onFinalizar={handleFinalizar} onEliminar={handleEliminar} />
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden md:block rounded-xl border overflow-hidden">
                      <LotesTable lotes={currentList} tipo={tab}
                        onFinalizar={handleFinalizar} onEliminar={handleEliminar} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}
