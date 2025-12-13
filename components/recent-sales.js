"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export function RecentSales({ sales = [] }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Últimas Ventas</CardTitle>
                <CardDescription>
                    Registro reciente de cierres de caja.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {sales.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay ventas recientes.</p>
                ) : (
                    sales.map((sale) => (
                        <div key={sale.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`/avatars/${sale.id % 5}.png`} alt="Avatar" />
                                <AvatarFallback>{sale.trabajador?.nombre?.substring(0, 2).toUpperCase() || 'TR'}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{sale.trabajador?.nombre || 'Desconocido'}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(sale.fechaFin).toLocaleDateString()} - {sale.turno === 'mañana' ? 'Mañana' : 'Tarde'}
                                </p>
                            </div>
                            <div className="ml-auto font-medium">{formatCurrency(sale.totalVentas)}</div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
