import { Outfit } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/tpv-navbar";
import { cn } from "@/lib/utils";

import { CierreProvider } from "@/contexts/CierreContext";

const font = Outfit({ subsets: ["latin"] });

export default function TpvLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn(font.className, "bg-slate-50 text-slate-900 overflow-hidden h-[100dvh] w-full flex flex-col")}>
      <CierreProvider>
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
        <Navbar />
        <Toaster position="top-center" richColors />
      </CierreProvider>
    </div>
  );
}
