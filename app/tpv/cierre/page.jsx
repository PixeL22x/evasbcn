"use client";

import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { MoonStar, TrendingUp, ShoppingBag, Receipt, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";

import { useCierre } from "@/contexts/CierreContext";
import { toast } from "sonner";

export default function Cierre() {
  const { isOnline } = useOnlineStatus();
  const { cerradoHoy, fechaCierre, checkEstado } = useCierre();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setLoading(false);
      setError("Sin conexión — no se puede cargar el resumen del día.");
      return;
    }
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/tpv/stats`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStats(data);
      } catch {
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isOnline]);

  const handleConfirmarCierre = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tpv/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cerrado: true })
      });
      if (!res.ok) throw new Error("Error al cerrar el TPV");
      
      // Update global context
      await checkEstado();
      
      setShowModal(false);
      setSuccess(true);
    } catch (err) {
      toast.error("Hubo un error al comunicar el cierre. Reintenta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 items-center justify-center p-6">
        <div className="flex flex-col md:flex-row items-center gap-8 max-w-xl w-full">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 size={52} className="text-emerald-400" />
          </div>
          <div className="flex flex-col gap-4 text-center md:text-left">
            <div>
              <h1 className="text-2xl font-black text-white">¡Día cerrado correctamente!</h1>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                El resumen está disponible para el cierre nocturno en el sistema principal.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 justify-center md:justify-start">
              <span className="text-slate-400 text-sm">Registrado a las</span>
              <span className="text-white font-black text-xl">{fechaCierre}</span>
            </div>
            <Link
              href="/caja"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Volver a Caja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Layout principal ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 overflow-hidden">

      {/* Header compacto */}
      <div className="px-4 py-3 shrink-0 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/caja"
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/10 inline-flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg">
              <MoonStar size={16} className="text-violet-400" />
            </div>
            <h1 className="text-base font-black text-white tracking-tight">Cierre de Día</h1>
          </div>
        </div>

        {cerradoHoy && (
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold text-xs">Cerrado · {fechaCierre}</span>
          </div>
        )}
      </div>

      {/* Contenido central — flex-1 con scroll */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-violet-400" />
            <p className="text-sm font-medium">Cargando resumen del día...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-red-400 font-bold text-sm text-center max-w-xs">{error}</p>
            <p className="text-slate-500 text-xs text-center">Conecta a internet para ver el resumen y cerrar el día.</p>
          </div>
        ) : stats ? (
          // Layout 2 columnas en landscape (md:), 1 columna en portrait
          <div className="h-full flex flex-col md:flex-row gap-3 max-w-3xl mx-auto">

            {/* Columna izquierda: Total grande */}
            <div className="md:w-1/2 flex flex-col gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center flex-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total del Día</p>
                <p className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                  {(stats.totalHoy ?? 0).toFixed(2)}
                </p>
                <span className="text-2xl text-violet-400 font-black mt-1">€</span>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/20 shrink-0">
                    <Receipt size={14} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Ventas</p>
                    <p className="text-white font-black text-xl leading-none">{stats.numVentas ?? 0}</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="p-2 bg-fuchsia-500/20 rounded-lg border border-fuchsia-500/20 shrink-0">
                    <TrendingUp size={14} className="text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Ticket Medio</p>
                    <p className="text-white font-black text-xl leading-none">{(stats.ticketMedio ?? 0).toFixed(2)} €</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: top productos + aviso */}
            <div className="md:w-1/2 flex flex-col gap-3">
              {stats.topProductos && stats.topProductos.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag size={13} className="text-violet-400" />
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Top Productos</p>
                  </div>
                  <div className="space-y-2">
                    {stats.topProductos.slice(0, 3).map((prod, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-black text-slate-500 shrink-0">#{idx + 1}</span>
                          <span className="text-white font-medium text-sm truncate">{prod.nombre ?? prod.nombreProducto}</span>
                        </div>
                        <span className="text-violet-400 font-black text-xs bg-violet-500/15 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                          {prod.cantidad ?? prod.totalVendido} uds
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aviso informativo */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex gap-2.5">
                <MoonStar size={13} className="text-violet-400 shrink-0 mt-0.5" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  El trabajador del cierre importará los datos desde el sistema principal.
                  Pulsa <span className="text-white font-bold">Confirmar Cierre</span> para registrar la hora en la tablet.
                </p>
              </div>
            </div>

          </div>
        ) : null}
      </div>

      {/* Footer fijo con botón — solo si no está cerrado */}
      {!loading && !error && !cerradoHoy && stats && (
        <div className="px-4 py-3 shrink-0 border-t border-white/10 bg-black/20">
          <Button
            onClick={() => setShowModal(true)}
            className="w-full h-12 rounded-2xl text-base font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-500/20"
          >
            <MoonStar size={18} className="mr-2" />
            Cerrar TPV Manualmente
          </Button>
        </div>
      )}

      {/* Modal de confirmación */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[85vw] max-w-xs rounded-3xl p-5 bg-slate-900 border border-white/10 shadow-2xl flex flex-col gap-0">
          <DialogHeader className="mb-3">
            <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-3 mx-auto">
              <MoonStar size={22} className="text-violet-400" />
            </div>
            <DialogTitle className="text-lg font-black text-white text-center">¿Cerrar el día?</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs text-center mt-1.5 leading-relaxed">
              El trabajador del cierre importará el resumen desde el sistema principal. Solo se registra la hora de cierre en la tablet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-1">
            <Button
              onClick={handleConfirmarCierre}
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-black text-white text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 border-0 hover:opacity-90 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "✓ Sí, Cerrar el Día"}
            </Button>
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => setShowModal(false)}
              className="w-full h-9 rounded-xl text-slate-400 text-sm font-bold hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
