import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/gemini';

// GET /api/tickets-diarios/product-sales
// Query params:
//   products   - comma-separated product name fragments (case-insensitive contains match)
//   from       - ISO date string (start)
//   to         - ISO date string (end)
//   groupBy    - 'day' | 'week' | 'month' (default: 'month')
//   aiInsight  - 'true' to request Gemini analysis

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const productsParam = searchParams.get('products') || '';
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        const groupBy = searchParams.get('groupBy') || 'month';
        const wantAi = searchParams.get('aiInsight') === 'true';

        // Parse product search terms
        const searchTerms = productsParam
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean);

        if (searchTerms.length === 0) {
            return NextResponse.json({ error: 'Se requiere al menos un producto' }, { status: 400 });
        }

        // Date range
        const startDate = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), 0, 1);
        const endDate = toParam ? new Date(toParam) : new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Fetch all completed tickets in range
        const tickets = await prisma.ticketDiario.findMany({
            where: {
                status: 'completado',
                fecha: { gte: startDate, lte: endDate },
            },
            select: { id: true, fecha: true, items: true },
            orderBy: { fecha: 'asc' },
        });

        // ─── Aggregate ────────────────────────────────────────────────
        let totalRevenue = 0;
        let totalUnits = 0;
        let ticketsAppeared = 0;

        // breakdown per exact name
        const breakdownMap = new Map(); // normalizedName -> { nombre, revenue, units }

        // trend: period key -> { revenue, units }
        const trendMap = new Map();

        tickets.forEach(ticket => {
            if (!ticket.items || !Array.isArray(ticket.items)) return;

            // Filter items that match any search term
            const matchedItems = ticket.items.filter(item => {
                const itemName = (item.nombre || '').toLowerCase();
                return searchTerms.some(term => itemName.includes(term));
            });

            if (matchedItems.length === 0) return;

            ticketsAppeared++;

            // Compute period key
            const d = new Date(ticket.fecha);
            let periodKey;
            if (groupBy === 'day') {
                periodKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (groupBy === 'week') {
                // ISO week: get monday of that week
                const day = d.getDay() || 7;
                const monday = new Date(d);
                monday.setDate(d.getDate() - day + 1);
                periodKey = monday.toISOString().split('T')[0];
            } else {
                // month
                periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!trendMap.has(periodKey)) {
                trendMap.set(periodKey, { period: periodKey, revenue: 0, units: 0 });
            }

            matchedItems.forEach(item => {
                const qty = item.cantidad || 1;
                const price = item.precio || 0;
                const key = (item.nombre || '').toLowerCase().trim();
                const display = (item.nombre || '').trim();

                totalRevenue += price;
                totalUnits += qty;

                const trend = trendMap.get(periodKey);
                trend.revenue += price;
                trend.units += qty;

                if (!breakdownMap.has(key)) {
                    breakdownMap.set(key, { product: display, revenue: 0, units: 0 });
                }
                const b = breakdownMap.get(key);
                b.revenue += price;
                b.units += qty;
            });
        });

        const trend = Array.from(trendMap.values()).sort((a, b) =>
            a.period.localeCompare(b.period)
        );

        const breakdown = Array.from(breakdownMap.values()).sort((a, b) =>
            b.revenue - a.revenue
        );

        const avgPricePerUnit = totalUnits > 0 ? totalRevenue / totalUnits : 0;

        const summary = {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalUnits,
            avgPricePerUnit: parseFloat(avgPricePerUnit.toFixed(2)),
            ticketsAppeared,
        };

        // ─── Optional AI Insight ──────────────────────────────────────
        let aiInsight = null;
        if (wantAi) {
            const prompt = `Analiza las siguientes ventas de productos para el negocio Eva's Barcelona:

Productos buscados: ${searchTerms.join(', ')}
Período: ${startDate.toLocaleDateString('es-ES')} – ${endDate.toLocaleDateString('es-ES')}

Datos:
- Ingresos totales: ${summary.totalRevenue.toFixed(2)}€
- Unidades vendidas: ${summary.totalUnits}
- Precio medio/ud: ${summary.avgPricePerUnit.toFixed(2)}€
- Tickets en que apareció: ${summary.ticketsAppeared}

Tendencia mensual:
${trend.map(t => `- ${t.period}: ${t.revenue.toFixed(2)}€ (${t.units} uds)`).join('\n')}

Desglose por variante:
${breakdown.map(b => `- "${b.product}": ${b.revenue.toFixed(2)}€ (${b.units} uds)`).join('\n')}

INSTRUCCIONES:
Genera un análisis breve en 3 viñetas (máximo 2 líneas cada una):
• TENDENCIA: ¿Cómo evolucionaron las ventas en el período?
• PRODUCTO ESTRELLA: ¿Qué variante destaca más y por qué?
• ACCIÓN: Una recomendación concreta para mejorar el rendimiento.

Tono: directo y profesional. Solo las 3 viñetas, sin introducción.`;

            try {
                aiInsight = await generateText(prompt);
            } catch (aiErr) {
                console.error('AI insight error:', aiErr);
                aiInsight = null;
            }
        }

        return NextResponse.json({ summary, trend, breakdown, aiInsight });

    } catch (error) {
        console.error('Error in product-sales:', error);
        return NextResponse.json({ error: 'Error al calcular ventas por producto' }, { status: 500 });
    }
}
