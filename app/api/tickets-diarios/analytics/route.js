import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch all tickets in range
        const tickets = await prisma.ticketDiario.findMany({
            where: {
                fecha: {
                    gte: startDate
                }
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        // Calculate summary metrics
        const totalSales = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
        const ticketCount = tickets.length;
        const avgTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

        // Calculate daily sales
        const dailySalesMap = new Map();
        tickets.forEach(ticket => {
            const dateKey = ticket.fecha.toISOString().split('T')[0];
            if (!dailySalesMap.has(dateKey)) {
                dailySalesMap.set(dateKey, { date: dateKey, total: 0, tickets: 0 });
            }
            const day = dailySalesMap.get(dateKey);
            day.total += ticket.total || 0;
            day.tickets += 1;
        });

        const dailySales = Array.from(dailySalesMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        // Calculate top products
        const productMap = new Map();
        tickets.forEach(ticket => {
            if (ticket.items && Array.isArray(ticket.items)) {
                ticket.items.forEach(item => {
                    const key = item.nombre;
                    if (!productMap.has(key)) {
                        productMap.set(key, { nombre: key, cantidad: 0, ingresos: 0 });
                    }
                    const product = productMap.get(key);
                    product.cantidad += item.cantidad || 0;
                    product.ingresos += item.precio || 0;
                });
            }
        });

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.ingresos - a.ingresos)
            .slice(0, 10);

        // Find top product
        const topProduct = topProducts.length > 0 ? topProducts[0].nombre : 'N/A';

        return NextResponse.json({
            summary: {
                totalSales: parseFloat(totalSales.toFixed(2)),
                ticketCount,
                avgTicket: parseFloat(avgTicket.toFixed(2)),
                topProduct
            },
            dailySales,
            topProducts
        });

    } catch (error) {
        console.error('Error calculating analytics:', error);
        return NextResponse.json(
            { error: 'Error al calcular analytics' },
            { status: 500 }
        );
    }
}
