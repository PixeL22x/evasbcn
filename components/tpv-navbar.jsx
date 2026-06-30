"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ClipboardList, Wifi, WifiOff, MoonStar } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function Navbar() {
  const pathname = usePathname();
  const { isOnline, pendingSyncs } = useOnlineStatus();

  return (
    <nav className="w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 h-14 flex items-center justify-between px-4 sm:px-8 shrink-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
      <div className="flex gap-1 sm:gap-2 h-full py-1.5">
        <Link 
          href="/tpv/caja" 
          className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
            ${pathname === "/tpv/caja" ? "bg-violet-50 text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <ShoppingCart size={20} className={pathname === "/tpv/caja" ? "text-violet-600" : ""} />
          Caja
        </Link>
        <Link 
          href="/tpv/historial" 
          className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
            ${pathname === "/tpv/historial" ? "bg-violet-50 text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <ClipboardList size={20} className={pathname === "/tpv/historial" ? "text-violet-600" : ""} />
          Historial
        </Link>
        <Link 
          href="/tpv/cierre" 
          className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
            ${pathname === "/tpv/cierre" ? "bg-violet-50 text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <MoonStar size={20} className={pathname === "/tpv/cierre" ? "text-violet-600" : ""} />
          Cierre
        </Link>
      </div>
      
      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
        {isOnline ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
            <span className="text-green-600 font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2 uppercase">
               Sistema Online
            </span>
          </>
        ) : (
          <>
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse" />
            <span className="text-red-600 font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2 uppercase">
              Offline
              {pendingSyncs > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md ml-1">{pendingSyncs} en cola</span>}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}
