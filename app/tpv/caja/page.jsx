"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Plus, Minus, X, CreditCard, Loader2, Trash2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCierre } from "@/contexts/CierreContext";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Caja() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("helados");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { isOnline } = useOnlineStatus();
  const { cerradoHoy, checkEstado } = useCierre();

  // Haptic feedback helper
  const vibrate = (pattern = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch(`/api/tpv/productos`, {
          next: { revalidate: 300 }
        });
        if (res.ok) {
          const data = await res.json();
          setProductos(data);
        } else {
          mockData();
        }
      } catch (err) {
        mockData();
      }
    };

    fetchProductos();
    const interval = setInterval(fetchProductos, 300000);
    return () => clearInterval(interval);
  }, []);

  const mockData = () => {
    setProductos([
      { id: "1", nombre: "Cucurucho 1 Bola", categoria: "helados", precio: 3.50, emoji: "🍦", orden: 1 },
      { id: "2", nombre: "Tarrina 2 Bolas", categoria: "helados", precio: 4.80, emoji: "🍨", orden: 2 },
      { id: "3", nombre: "Polo de Fresa", categoria: "helados", precio: 2.50, emoji: "🍧", orden: 3 },
      { id: "4", nombre: "Agua 50cl", categoria: "bebidas", precio: 1.50, emoji: "💧", orden: 1 },
      { id: "5", nombre: "Refresco", categoria: "bebidas", precio: 2.20, emoji: "🥤", orden: 2 },
      { id: "6", nombre: "Gofre Nutella", categoria: "postres", precio: 5.50, emoji: "🧇", orden: 1 },
      { id: "7", nombre: "Trozos Fresa", categoria: "postres", precio: 1.50, emoji: "🍓", orden: 2 },
      { id: "8", nombre: "6 Churros", categoria: "churros", precio: 4.00, emoji: "🥨", orden: 1 },
    ]);
  };

  const categorias = ["helados", "bebidas", "postres", "churros", "otros"];

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => p.categoria === categoriaActiva).sort((a, b) => a.orden - b.orden);
  }, [productos, categoriaActiva]);

  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }, [carrito]);

  const addToCart = (producto) => {
    vibrate(15);
    setCarrito((prev) => {
      const exist = prev.find((item) => item.productoId === producto.id);
      if (exist) {
        return prev.map((item) =>
          item.productoId === producto.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio }
            : item
        );
      }
      return [...prev, { 
        productoId: producto.id, 
        nombreProducto: producto.nombre, 
        precio: producto.precio, 
        cantidad: 1, 
        subtotal: producto.precio 
      }];
    });
  };

  const updateQuantity = (id, change) => {
    vibrate(10);
    setCarrito((prev) => {
      return prev.map((item) => {
        if (item.productoId === id) {
          const newQ = item.cantidad + change;
          if (newQ < 1) return null;
          return { ...item, cantidad: newQ, subtotal: newQ * item.precio };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeItem = (id) => {
    vibrate([10, 30, 10]);
    setCarrito((prev) => prev.filter((item) => item.productoId !== id));
  };

  const clearCart = () => {
    vibrate([20, 50, 20, 50, 40]);
    setCarrito([]);
  };

  const handleCobrar = async () => {
    setLoading(true);
    const payload = { lineas: carrito };
    try {
      if (!isOnline) throw new Error("Offline");
      const res = await fetch(`/api/tpv/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error en el cobro");
      toast.success("Cobrado Exitosamente");
    } catch (error) {
      const queue = JSON.parse(localStorage.getItem("tpv_offline_queue") || "[]");
      queue.push({
        lineas: carrito,
        timestamp: new Date().toISOString(),
        id_local: Date.now().toString()
      });
      localStorage.setItem("tpv_offline_queue", JSON.stringify(queue));
      toast.warning("Guardado offline en cola");
    } finally {
      setLoading(false);
      setShowModal(false);
      setCarrito([]);
    }
  };

  const handleReabrir = async () => {
    try {
      const res = await fetch(`/api/tpv/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cerrado: false })
      });
      if (res.ok) {
        await checkEstado();
        toast.success("TPV reabierto con éxito");
      } else {
        throw new Error("Error en la respuesta");
      }
    } catch (err) {
      toast.error("No se pudo reabrir el TPV");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-50 overflow-hidden relative">
      
      {/* OVERLAY CIERRE */}
      {cerradoHoy && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center scale-in-95 animate-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">TPV Cerrado por hoy</h2>
            <p className="text-slate-500 text-base leading-relaxed mb-6">
              El resumen de ventas ya ha sido enviado y adjuntado al cierre del sistema principal.
            </p>
            <Button 
              variant="outline" 
              onClick={handleReabrir}
              className="text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              Reabrir TPV Manualmente
            </Button>
          </div>
        </div>
      )}

      {/* LEFT COLUMN */}
      <div className="w-full md:w-[60%] h-[55%] md:h-full flex flex-col relative z-10 min-h-0 min-w-0">
        {/* Categories Tabs via Shadcn */}
        <div className="px-4 md:px-6 pb-4 pt-6 shrink-0">
          <Tabs defaultValue="helados" onValueChange={setCategoriaActiva} className="w-full">
            <TabsList className="bg-slate-200/70 p-1.5 rounded-xl md:rounded-full flex w-full gap-1 h-14 shadow-inner">
              {categorias.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="flex-1 rounded-lg md:rounded-full h-full px-1 text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wide data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 transition-all hover:bg-white/50 data-[state=active]:hover:bg-none truncate"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Product Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-2 overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {productosFiltrados.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white border border-slate-100 rounded-[28px] overflow-hidden flex flex-col items-center justify-center transition-all duration-300 active:scale-90 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 h-36 sm:h-44 lg:h-48 group relative shadow-sm shadow-slate-200"
              >
                {/* Image or Emoji area */}
                {p.imageUrl ? (
                  <div className="w-full flex-1 relative overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to emoji on image load error
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    {/* Hidden fallback emoji shown on image error */}
                    <div className="hidden w-full h-full absolute inset-0 items-center justify-center text-6xl bg-violet-50">
                      {p.emoji}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center w-full bg-gradient-to-br from-violet-50 to-fuchsia-50 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-violet-200 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-xl" />
                    <span className="text-6xl group-hover:-translate-y-1 group-active:scale-75 transition-all duration-300 relative z-10">
                      {p.emoji}
                    </span>
                  </div>
                )}

                {/* Name & Price footer */}
                <div className="w-full px-3 py-2.5 bg-white border-t border-slate-100 text-center shrink-0">
                  <h3 className="text-[14px] font-bold leading-tight line-clamp-1 text-slate-700">{p.nombre}</h3>
                  <p className="text-lg font-black text-violet-600 mt-0.5">{p.precio.toFixed(2)} €</p>
                </div>
              </button>
            ))}
            {productosFiltrados.length === 0 && (
              <div className="col-span-3 h-44 flex items-center justify-center text-slate-400 font-medium bg-white/50 rounded-[28px] border border-slate-200 border-dashed">
                No hay productos en esta categoría
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full md:w-[40%] h-[45%] md:h-full flex flex-col bg-white relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] border-t md:border-t-0 md:border-l border-slate-100 min-h-0 min-w-0">
        <div className="p-3 px-4 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-violet-100 rounded-lg text-violet-600">
              <ShoppingCart size={20} />
            </div>
            Pedido
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-xs px-2.5 py-0.5 rounded-full">
              {carrito.length} items
            </Badge>
            {carrito.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCart}
                className="h-7 w-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Vaciar pedido"
              >
                <Trash2 size={15} />
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 md:p-3 overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
          <div className="space-y-1.5 pb-2">
            {carrito.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <ShoppingCart size={40} className="opacity-40" />
                </div>
                <p className="text-lg font-medium text-slate-500">Comienza a añadir productos</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.productoId} className="flex items-center p-1.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-right-2 duration-200 group">
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.productoId, -1)} className="h-7 w-7 bg-white hover:bg-slate-200 shadow-sm rounded-md text-slate-600">
                      <Minus size={14} />
                    </Button>
                    <span className="font-black w-6 text-center text-[14px] text-slate-800">{item.cantidad}</span>
                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.productoId, 1)} className="h-7 w-7 bg-white hover:bg-slate-200 shadow-sm rounded-md text-slate-600">
                      <Plus size={14} />
                    </Button>
                  </div>
                  
                  {/* Name */}
                  <div className="flex-1 min-w-0 px-3">
                    <div className="font-bold text-[14px] leading-tight text-slate-800 truncate">{item.nombreProducto}</div>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-black text-[15px] text-violet-600 w-14 text-right mr-1">{item.subtotal.toFixed(2)} €</span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.productoId)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-7 w-7 rounded-md opacity-70 group-hover:opacity-100 transition-opacity">
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Checkout Section */}
        <div className="p-3 px-4 bg-slate-50 border-t border-slate-100 shrink-0 relative">
          <div className="flex justify-between items-end mb-3 px-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Total a Pagar</span>
            <span className="text-3xl font-black text-slate-800 tracking-tight">{totalCarrito.toFixed(2)} <span className="text-xl text-violet-500">€</span></span>
          </div>
          <Button
            size="lg"
            disabled={carrito.length === 0}
            onClick={() => setShowModal(true)}
            className="w-full h-14 rounded-2xl text-xl font-black tracking-wide bg-gradient-to-r from-emerald-400 to-green-500 text-white hover:scale-[1.02] active:scale-95 shadow-[0_5px_15px_rgba(52,211,153,0.3)] hover:shadow-[0_10px_25px_rgba(52,211,153,0.4)] border-0 disabled:opacity-50 disabled:grayscale transition-all duration-300"
          >
            <CreditCard size={24} className={carrito.length > 0 ? "mr-2 text-white/90" : "mr-2"} />
            COBRAR
          </Button>
        </div>
      </div>

      {/* Dialog for Checkout via Shadcn */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[90vw] max-w-sm rounded-3xl p-6 bg-white border-slate-100 shadow-2xl flex flex-col items-center overflow-hidden gap-0">
          <DialogHeader className="flex flex-col items-center w-full mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30">
              <CreditCard size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 text-center">Pago con Tarjeta</DialogTitle>
            <DialogDescription className="text-sm text-center mt-1 text-slate-500">
              Acerca la tarjeta al datáfono para continuar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-6xl font-black text-slate-800 my-4 tracking-tighter text-center">
            {totalCarrito.toFixed(2)}<span className="text-3xl text-violet-500 ml-2">€</span>
          </div>

          <div className="w-full space-y-2.5">
            <Button
              onClick={handleCobrar}
              disabled={loading}
              className="w-full h-14 rounded-2xl text-lg font-black text-white bg-gradient-to-r from-emerald-400 to-green-500 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
            >
              {loading ? <><Loader2 className="mr-2 animate-spin w-5 h-5" /> PROCESANDO...</> : "✓ CONFIRMAR COBRO"}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              disabled={loading}
              className="w-full h-11 rounded-2xl text-base text-slate-500 font-bold hover:bg-slate-100"
            >
              Cancelar Operación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
