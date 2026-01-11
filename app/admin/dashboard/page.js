"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import AdminLayout from '../../../components/AdminLayout'
import AdminNotesWidget from '../../../components/admin/AdminNotesWidget'

export default function AdminDashboard() {

  return (
    <AdminLayout>
      <SidebarProvider
        style={{
          "--sidebar-width": "19rem",
          "--header-height": "4rem",
        }}
      >
        {/* Hide sidebar on mobile, show on desktop */}
        <div className="hidden md:block">
          <AppSidebar variant="inset" />
        </div>

        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl pb-safe">
                <div className="space-y-3 sm:space-y-6">
                  <SectionCards />
                  <ChartAreaInteractive />
                  <AdminNotesWidget />
                  <DataTable />
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminLayout>
  )
}

