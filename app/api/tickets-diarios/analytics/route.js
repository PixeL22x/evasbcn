import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        let startDate, endDate, prevStartDate, prevEndDate;

        // Check if we have specific date range
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (from && to) {
            startDate = new Date(from);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);

            // Calculate duration in milliseconds
            const duration = endDate.getTime() - startDate.getTime();

            // Previous period is same duration before start date
            prevEndDate = new Date(startDate.getTime());
            prevStartDate = new Date(startDate.getTime() - duration - 86400000); // subtract 1 extra day to avoid overlap if needed, or matches duration
        } else {
            // Default logic based on days
            const days = parseInt(searchParams.get('days') || '30');

            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            // Previous period
            prevEndDate = new Date(startDate);
            prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - days);
        }

        // Fetch current period tickets
        const tickets = await prisma.ticketDiario.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        // Fetch previous period tickets for comparison
        const prevTickets = await prisma.ticketDiario.findMany({
            where: {
                fecha: {
                    gte: prevStartDate,
                    lt: startDate
                }
            }
        });

        // Calculate summary metrics
        const totalSales = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
        const ticketCount = tickets.length;
        const avgTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

        // Previous period metrics
        const prevTotalSales = prevTickets.reduce((sum, t) => sum + (t.total || 0), 0);
        const prevTicketCount = prevTickets.length;

        // Calculate percentage changes
        const salesChange = prevTotalSales > 0
            ? ((totalSales - prevTotalSales) / prevTotalSales) * 100
            : 0;
        const ticketsChange = prevTicketCount > 0
            ? ((ticketCount - prevTicketCount) / prevTicketCount) * 100
            : 0;

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

        // Calculate top products by revenue
        const productMap = new Map();
        tickets.forEach(ticket => {
            if (ticket.items && Array.isArray(ticket.items)) {
                ticket.items.forEach(item => {
                    // Normalize key to lowercase + trim to merge duplicates like "1 bola" and "1 Bola"
                    const key = (item.nombre || '').toLowerCase().trim();

                    if (!key) return; // Skip empty names

                    if (!productMap.has(key)) {
                        productMap.set(key, {
                            nombre: item.nombre, // Keep original capitalization from first occurrence
                            cantidad: 0,
                            ingresos: 0
                        });
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

        // Top products by quantity
        const topProductsByQuantity = Array.from(productMap.values())
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);

        // Find top product
        const topProduct = topProducts.length > 0 ? topProducts[0].nombre : 'N/A';

        return NextResponse.json({
            summary: {
                totalSales: parseFloat(totalSales.toFixed(2)),
                ticketCount,
                avgTicket: parseFloat(avgTicket.toFixed(2)),
                topProduct
            },
            comparison: {
                sales: parseFloat(salesChange.toFixed(1)),
                tickets: parseFloat(ticketsChange.toFixed(1))
            },
            dailySales,
            topProducts,
            topProductsByQuantity
        });

    } catch (error) {
        console.error('Error calculating analytics:', error);
        return NextResponse.json(
            { error: 'Error al calcular analytics' },
            { status: 500 }
        );
    }
}
