import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/gemini';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const DEFAULT_TURNOS = {
    M: { hours: 5.5 },
    T: { hours: 6 },
    L: { hours: 0 }
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month'));
        const year = parseInt(searchParams.get('year'));

        if (!month || !year) {
            return NextResponse.json({ error: 'Mes y año requeridos' }, { status: 400 });
        }

        // Calculate date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = endOfMonth(startDate);

        // 1. FETCH SALES (Tickets)
        const tickets = await prisma.ticketDiario.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const totalSales = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
        const ticketCount = tickets.length;
        const avgTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

        // Top Products
        const productMap = new Map();
        tickets.forEach(ticket => {
            if (ticket.items && Array.isArray(ticket.items)) {
                ticket.items.forEach(item => {
                    const key = (item.nombre || '').toLowerCase().trim();
                    if (!key) return;
                    if (!productMap.has(key)) {
                        productMap.set(key, { nombre: item.nombre, cantidad: 0, ingresos: 0 });
                    }
                    const p = productMap.get(key);
                    p.cantidad += item.cantidad || 0;
                    p.ingresos += item.precio || 0;
                });
            }
        });
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);

        // 2. FETCH EXPENSES (Facturas)
        const facturas = await prisma.factura.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const totalExpenses = facturas.reduce((sum, f) => sum + f.total, 0);
        const expenseCategories = {};
        facturas.forEach(f => {
            const cat = f.categoria || 'otros';
            expenseCategories[cat] = (expenseCategories[cat] || 0) + f.total;
        });

        // 3. FETCH & CALCULATE ASSIGNED STAFF HOURS (from Schedule)

        // A. Fetch Active Configuration
        let configTurnos = DEFAULT_TURNOS;
        try {
            const config = await prisma.configuracion.findUnique({
                where: { clave: 'horarios_active_profile' }
            });
            if (config?.valor?.shifts) {
                // If complex structure, we might need traversal, but usually keys M, T map directly
                // We need to support the day-indexed structure: shifts.M[0].hours
                configTurnos = config.valor.shifts;
            }
        } catch (e) {
            console.error("Error fetching config, using defaults", e);
        }

        // B. Fetch Active Workers
        // B. Fetch Active Workers
        let trabajadores = await prisma.trabajador.findMany({
            where: { activo: true }
        });

        // Filter out admins in memory to avoid Prisma "mode" operator issues
        trabajadores = trabajadores.filter(t =>
            t.cargo !== 'admin' &&
            !t.nombre.toLowerCase().includes('admin')
        );

        // C. Fetch Weekly Rules
        const reglas = await prisma.reglaHorario.findMany({});
        const reglasMap = new Map(); // workerId -> { dayOfWeek -> turno }
        reglas.forEach(r => {
            if (!reglasMap.has(r.trabajadorId)) reglasMap.set(r.trabajadorId, new Map());
            reglasMap.get(r.trabajadorId).set(r.diaSemana, r.turno);
        });

        // D. Fetch Exceptions for month
        // Use Barcelona timezone logic for consistency
        const barcelonaTimeZone = 'Europe/Madrid';
        const monthStart = fromZonedTime(new Date(year, month - 1, 1), barcelonaTimeZone);
        const monthEnd = fromZonedTime(new Date(year, month, 1), barcelonaTimeZone);

        const excepciones = await prisma.excepcionHorario.findMany({
            where: {
                fecha: { gte: monthStart, lt: monthEnd }
            }
        });
        const excepcionesMap = new Map(); // workerId -> { isoDate -> turno }
        excepciones.forEach(e => {
            if (!excepcionesMap.has(e.trabajadorId)) excepcionesMap.set(e.trabajadorId, new Map());
            const iso = new Date(e.fecha).toISOString().slice(0, 10);
            excepcionesMap.get(e.trabajadorId).set(iso, e.turno);
        });

        // E. Calculate Hours
        const staffStatsMap = new Map();

        // Helper to get hours from config
        const getHours = (turno, dow) => {
            if (!configTurnos[turno]) return 0;
            // Check if day-indexed
            if (configTurnos[turno][dow]) return configTurnos[turno][dow].hours || 0;
            // Fallback for simple config
            return configTurnos[turno].hours || 0;
        };

        const daysInMonth = [];
        let d = new Date(Date.UTC(year, month - 1, 1));
        while (d.getUTCMonth() === month - 1) {
            daysInMonth.push({
                iso: d.toISOString().slice(0, 10),
                dow: d.getUTCDay()
            });
            d.setUTCDate(d.getUTCDate() + 1);
        }

        trabajadores.forEach(t => {
            let totalHours = 0;
            let totalShifts = 0;

            daysInMonth.forEach(day => {
                // Determine turno
                let turno = 'L'; // Default free

                // 1. Weekly Rule
                if (reglasMap.has(t.id) && reglasMap.get(t.id).has(day.dow)) {
                    turno = reglasMap.get(t.id).get(day.dow);
                }

                // 2. Exception Override
                if (excepcionesMap.has(t.id) && excepcionesMap.get(t.id).has(day.iso)) {
                    turno = excepcionesMap.get(t.id).get(day.iso);
                }

                // 3. Get Hours
                if (turno !== 'L') {
                    const h = getHours(turno, day.dow);
                    totalHours += h;
                    if (h > 0) totalShifts++;
                }
            });

            staffStatsMap.set(t.nombre, {
                nombre: t.nombre,
                horas: totalHours,
                turnos: totalShifts
            });
        });

        const staffStats = Array.from(staffStatsMap.values()).sort((a, b) => b.horas - a.horas);
        const totalStaffHours = staffStats.reduce((sum, s) => sum + s.horas, 0);


        // 4. FETCH ADMIN NOTES (NotaAdmin)
        const notes = await prisma.notaAdmin.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { fecha: 'asc' }
        });

        // 5. GENERATE AI SUMMARY
        const stats = {
            totalSales,
            totalExpenses,
            netResult: totalSales - totalExpenses,
            ticketCount,
            avgTicket,
            totalStaffHours,
            topProducts,
            expenseCategories,
            staffStats,
            notesCount: notes.length
        };

        const prompt = `Analiza los siguientes datos mensuales de un negocio de heladería y cafetería ("Eva's Barcelona") para el mes de ${format(startDate, 'MMMM yyyy', { locale: es })}.
        
        DATOS FINANCIEROS:
        - Ventas Totales: ${totalSales.toFixed(2)}€
        - Gastos Totales: ${totalExpenses.toFixed(2)}€
        - Resultado Neto: ${(totalSales - totalExpenses).toFixed(2)}€
        - Nº de Días/Cierres: ${ticketCount}
        - Promedio Venta Diaria: ${avgTicket.toFixed(2)}€
        
        TOP PRODUCTOS (Unidades):
        ${topProducts.map(p => `- ${p.nombre}: ${p.cantidad} u.`).join('\n')}
        
        GASTOS POR CATEGORÍA:
        ${Object.entries(expenseCategories).map(([cat, total]) => `- ${cat}: ${total.toFixed(2)}€`).join('\n')}
        
        RECURSOS HUMANOS (Horas Asignadas):
        - Horas Totales Planificadas: ${totalStaffHours.toFixed(2)} h
        - Productividad (Ventas/Hora Planificada): ${(totalStaffHours > 0 ? totalSales / totalStaffHours : 0).toFixed(2)} €/hora
        
        NOTAS E INCIDENCIAS DEL MES (${notes.length}):
        ${notes.map(n => `- [${format(new Date(n.fecha), 'dd/MM')}] ${n.titulo}: ${n.contenido}`).join('\n')}
        
        INSTRUCCIONES PARA LA IA:
        Actúa como un **Experto Analista Financiero especializado en Heladerías, Creperías y Negocios de Hostelería de Alto Rendimiento**.
        Conoces a fondo el negocio de venta de helados, waffles, creps, smoothies y acai bowls.

        IMPORTANTE: 
        - Tu objetivo es encontrar correlaciones profundas entre las NOTAS DEL MES (incidencias operativas) y los RESULTADOS (Ventas/Productividad).
        - Debes leer y analizar CADA UNA de las notas proporcionadas para explicar los picos o bajadas.
        - Escribe de forma fluida, profesional y narrativa (sin markdown excesivo, sin asteriscos).

        Estructura la respuesta en 3 párrafos densos y ricos en contenido:

        1. PRIMER PÁRRAFO (Análisis Financiero & Contexto):
           Analiza la salud financiera del mes. ¿Se han cumplido objetivos de rentabilidad? Conecta el resultado de ventas con la naturaleza de los productos (ej: si fue un mes de mucho helado o más de cafetería/waffles según la época).

        2. SEGUNDO PÁRRAFO (Operativa, Personal e Incidencias):
           Este es el punto más crítico. Cruza los datos de Productividad del personal con las NOTAS. Ej: "A pesar de la baja productividad el día X, la nota indica lluvia/obras...", o "El pico de ventas coincidió con...". Demuestra que has leído todas las incidencias y explicas el 'por qué' de los números.

        3. TERCER PÁRRAFO (Estrategia de Crecimiento):
           Recomendaciones expertas para potenciar la venta cruzada (ej: waffer con helado, extras en acai) o ajustes de personal basados en los patrones detectados.

        Tono: Experto, observador, estratégico y directo al grano. Nada de generalidades.`;

        const aiSummary = await generateText(prompt);

        return NextResponse.json({
            stats,
            notes,
            aiSummary
        });

    } catch (error) {
        console.error('Error generating monthly report:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
    }
}
