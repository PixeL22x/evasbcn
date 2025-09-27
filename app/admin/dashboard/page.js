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

export default function AdminDashboard() {
  return (
    <AdminLayout>
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
          "--header-height": "4rem",
        }
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <div className="space-y-6">
                <SectionCards />
                <ChartAreaInteractive />
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
