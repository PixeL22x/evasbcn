"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const CierreContext = createContext({});

export function isSameDay(isoDateStr) {
  if (!isoDateStr) return false;
  const saved = new Date(isoDateStr);
  const now = new Date();
  return (
    saved.getUTCFullYear() === now.getUTCFullYear() &&
    saved.getUTCMonth() === now.getUTCMonth() &&
    saved.getUTCDate() === now.getUTCDate()
  );
}

export function CierreProvider({ children }) {
  const [cerradoHoy, setCerradoHoy] = useState(false);
  const [fechaCierre, setFechaCierre] = useState(null);
  const { isOnline } = useOnlineStatus();

  const checkEstado = async () => {
    if (!isOnline) return;
    try {
      const res = await fetch(`/api/tpv/estado`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        // data: { cerrado: boolean, fecha: string }
        if (data.cerrado && isSameDay(data.fecha)) {
          setCerradoHoy(true);
          setFechaCierre(new Date(data.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
        } else {
          setCerradoHoy(false);
          setFechaCierre(null);
        }
      }
    } catch (err) {
      console.error("Error comprobando estado de cierre:", err);
    }
  };

  useEffect(() => {
    checkEstado();
    const interval = setInterval(checkEstado, 15000); // 15s polling
    return () => clearInterval(interval);
  }, [isOnline]);

  return (
    <CierreContext.Provider value={{ cerradoHoy, fechaCierre, checkEstado }}>
      {children}
    </CierreContext.Provider>
  );
}

export const useCierre = () => useContext(CierreContext);
