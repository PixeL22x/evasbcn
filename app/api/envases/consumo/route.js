import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Helper: does itemName match the recipe rule? ────────────────────────────
function matchesReceta(itemName, receta) {
    const name = itemName.toLowerCase().trim();
    const pattern = receta.productoNombre.toLowerCase().trim();

    switch (receta.matchType) {
        case 'exact':
            return name === pattern;
        case 'startsWith':
            return name.startsWith(pattern);
        case 'contains':
        default:
            return name.includes(pattern);
    }
}

// GET /api/envases/consumo?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const startDate = fromParam ? new Date(fromParam) : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d;
        })();
        const endDate = toParam ? new Date(toParam) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // 1. Fetch completed tickets in range
        const tickets = await prisma.ticketDiario.findMany({
            where: {
                status: 'completado',
                fecha: { gte: startDate, lte: endDate },
            },
            select: { id: true, fecha: true, items: true },
            orderBy: { fecha: 'asc' },
        });

        // 2. Fetch all recipes with their envase
        const recetas = await prisma.recetaEnvase.findMany({
            include: { envase: true },
        });

        // 3. Fetch all active envases (for stock state even if no consumption)
        const envases = await prisma.envase.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });

        // 4. Apply recipes to ticket items
        // consumoMap: envaseId → { envase, totalUnidades, porDia: { dateKey → unidades } }
        const consumoMap = new Map();

        // Initialize all envases in the map (even with 0 consumption)
        envases.forEach(env => {
            consumoMap.set(env.id, {
                envase: env,
                totalUnidades: 0,
                porDia: {},
            });
        });

        let totalTickets = tickets.length;
        let diasConActividad = new Set();

        tickets.forEach(ticket => {
            if (!ticket.items || !Array.isArray(ticket.items)) return;

            const dateKey = new Date(ticket.fecha).toISOString().split('T')[0];
            diasConActividad.add(dateKey);

            ticket.items.forEach(item => {
                const itemNombre = item.nombre || '';
                const itemCantidad = parseFloat(item.cantidad) || 0;

                // Find all recipes that match this item
                recetas.forEach(receta => {
                    if (!matchesReceta(itemNombre, receta)) return;

                    const envaseId = receta.envaseId;
                    if (!consumoMap.has(envaseId)) {
                        consumoMap.set(envaseId, {
                            envase: receta.envase,
                            totalUnidades: 0,
                            porDia: {},
                        });
                    }

                    const entry = consumoMap.get(envaseId);
                    const unidadesConsumidas = itemCantidad * receta.cantidad;

                    entry.totalUnidades += unidadesConsumidas;

                    if (!entry.porDia[dateKey]) entry.porDia[dateKey] = 0;
                    entry.porDia[dateKey] += unidadesConsumidas;
                });
            });
        });

        // 5. Build response
        const consumo = Array.from(consumoMap.values())
            .map(entry => ({
                envase: entry.envase,
                totalUnidades: Math.round(entry.totalUnidades * 100) / 100,
                stockActual: entry.envase.stockActual,
                stockMinimo: entry.envase.stockMinimo,
                // Projected stock after current consumption
                stockRestante: entry.envase.stockActual - entry.totalUnidades,
                alerta: entry.envase.stockActual - entry.totalUnidades < entry.envase.stockMinimo,
                porDia: Object.entries(entry.porDia)
                    .map(([fecha, unidades]) => ({ fecha, unidades: Math.round(unidades * 100) / 100 }))
                    .sort((a, b) => a.fecha.localeCompare(b.fecha)),
            }))
            .sort((a, b) => b.totalUnidades - a.totalUnidades);

        // 6. Top consumers for dashboard
        const topConsumo = consumo
            .filter(c => c.totalUnidades > 0)
            .slice(0, 5);

        const alertas = consumo.filter(c => c.alerta && c.envase.activo);

        return NextResponse.json({
            periodo: {
                desde: startDate.toISOString().split('T')[0],
                hasta: endDate.toISOString().split('T')[0],
            },
            stats: {
                totalTickets,
                diasConActividad: diasConActividad.size,
                totalAlertas: alertas.length,
            },
            consumo,
            topConsumo,
            alertas,
        });

    } catch (error) {
        console.error('Error calculating consumo envases:', error);
        return NextResponse.json({ error: 'Error al calcular consumo' }, { status: 500 });
    }
}
