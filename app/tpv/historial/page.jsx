"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, RefreshCw, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";

export default function Historial() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isOnline } = useOnlineStatus();

  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/tpv/ventas?hoy=true`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Error fetching");
      const data = await res.json();
      const validVentas = (data.ventas || []).filter((v) => !v.anulada);
      // Más recientes primero
      setVentas(validVentas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError("No se pudieron cargar las ventas de hoy");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchVentas();
    } else {
      setLoading(false);
      setError("Sin conexión — no se puede cargar el historial");
    }
  }, [isOnline]);

  const totalDia = ventas.reduce((acc, v) => acc + v.total, 0);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">

      {/* Header compacto */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/caja"
            className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 inline-flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-100 rounded-lg text-violet-600">
              <Receipt size={18} />
            </div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">
              Historial de Hoy
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Total del día */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
            <TrendingUp size={14} className="text-emerald-500" />
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none">Caja del día</p>
              <p className="text-lg font-black text-emerald-600 leading-tight">{totalDia.toFixed(2)} €</p>
            </div>
          </div>

          {/* Recargar */}
          <Button
            size="icon"
            onClick={fetchVentas}
            disabled={loading || !isOnline}
            className="h-9 w-9 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 border-0 shadow-md active:scale-95 transition-all"
          >
            <RefreshCw
              className={loading ? "animate-spin text-white" : "text-white"}
              size={16}
            />
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      {!loading && !error && ventas.length > 0 && (
        <div className="px-4 py-2 bg-white border-b border-slate-100 shrink-0 flex gap-3">
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-black text-slate-700">{ventas.length}</span> ventas registradas
          </div>
          <div className="text-xs text-slate-300">|</div>
          <div className="text-xs text-slate-500 font-medium">
            Ticket medio: <span className="font-black text-violet-600">{(totalDia / ventas.length).toFixed(2)} €</span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="animate-spin text-violet-400" size={32} />
            <p className="text-sm font-medium">Cargando ventas...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center mt-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center max-w-sm w-full">
              <p className="text-red-500 font-bold text-sm">{error}</p>
              {isOnline && (
                <Button
                  onClick={fetchVentas}
                  className="mt-3 h-9 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl border-0"
                >
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        ) : ventas.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Receipt size={36} className="opacity-40" />
            </div>
            <p className="text-base font-medium text-slate-500">Sin ventas registradas aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-3">
            {ventas.map((venta, idx) => (
              <div
                key={venta.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 hover:border-violet-200 hover:shadow-lg transition-all duration-200 shadow-sm animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
              >
                {/* Cabecera de la venta */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                      <p className="text-violet-600 font-black text-sm">
                        {format(new Date(venta.createdAt), "HH:mm", { locale: es })}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">#{venta.id.slice(-5)}</p>
                  </div>
                  <span className="text-xl font-black text-slate-800">
                    {venta.total.toFixed(2)} <span className="text-violet-500 text-base">€</span>
                  </span>
                </div>

                {/* Líneas del pedido */}
                <div className="space-y-1.5">
                  {(venta.lineas || []).map((linea, lIdx) => (
                    <div
                      key={lIdx}
                      className="flex justify-between items-center text-[13px] px-2 py-1.5 rounded-lg bg-slate-50"
                    >
                      <span className="text-slate-600 font-medium flex items-center gap-2 min-w-0">
                        <span className="text-violet-600 font-black shrink-0 px-1.5 py-0.5 bg-violet-100 rounded-md text-xs">
                          {linea.cantidad}
                        </span>
                        <span className="truncate">{linea.nombreProducto}</span>
                      </span>
                      <span className="text-slate-700 font-bold shrink-0 ml-2">
                        {linea.subtotal.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
