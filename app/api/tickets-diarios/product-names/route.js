import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tickets-diarios/product-names
// Returns a deduplicated, sorted list of all product names found in ticket items
export async function GET() {
    try {
        const tickets = await prisma.ticketDiario.findMany({
            where: { status: 'completado' },
            select: { items: true },
        });

        const nameSet = new Set();

        tickets.forEach(ticket => {
            if (ticket.items && Array.isArray(ticket.items)) {
                ticket.items.forEach(item => {
                    const name = (item.nombre || '').trim();
                    if (name) nameSet.add(name);
                });
            }
        });

        const names = Array.from(nameSet).sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
        );

        return NextResponse.json({ names });
    } catch (error) {
        console.error('Error fetching product names:', error);
        return NextResponse.json({ error: 'Error al obtener nombres de productos' }, { status: 500 });
    }
}
