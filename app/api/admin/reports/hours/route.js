import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/gemini';
import { startOfMonth, endOfMonth, format } from 'date-fns';
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

        // 1. FETCH ACTIVE CONFIGURATION
        let configTurnos = DEFAULT_TURNOS;
        try {
            const config = await prisma.configuracion.findUnique({
                where: { clave: 'horarios_active_profile' }
            });
            if (config?.valor?.shifts) {
                configTurnos = config.valor.shifts;
            }
        } catch (e) {
            console.error("Error fetching config, using defaults", e);
        }

        // 2. FETCH ACTIVE WORKERS (excluding admins)
        let trabajadores = await prisma.trabajador.findMany({
            where: { activo: true }
        });

        trabajadores = trabajadores.filter(t =>
            t.cargo !== 'admin' &&
            !t.nombre.toLowerCase().includes('admin')
        );

        // 3. FETCH WEEKLY RULES
        const reglas = await prisma.reglaHorario.findMany({});
        const reglasMap = new Map();
        reglas.forEach(r => {
            if (!reglasMap.has(r.trabajadorId)) reglasMap.set(r.trabajadorId, new Map());
            reglasMap.get(r.trabajadorId).set(r.diaSemana, r.turno);
        });

        // 4. FETCH EXCEPTIONS FOR MONTH
        const barcelonaTimeZone = 'Europe/Madrid';
        const monthStart = fromZonedTime(new Date(year, month - 1, 1), barcelonaTimeZone);
        const monthEnd = fromZonedTime(new Date(year, month, 1), barcelonaTimeZone);

        const excepciones = await prisma.excepcionHorario.findMany({
            where: {
                fecha: { gte: monthStart, lt: monthEnd }
            }
        });
        const excepcionesMap = new Map();
        excepciones.forEach(e => {
            if (!excepcionesMap.has(e.trabajadorId)) excepcionesMap.set(e.trabajadorId, new Map());
            const iso = new Date(e.fecha).toISOString().slice(0, 10);
            excepcionesMap.get(e.trabajadorId).set(iso, e.turno);
        });

        // 5. CALCULATE HOURS
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
            let totalHoras = 0;
            let totalShifts = 0;
            let detallesDias = [];

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
                    totalHoras += h;
                    if (h > 0) totalShifts++;
                    detallesDias.push({ fecha: day.iso, turno, horas: h });
                }
            });

            staffStatsMap.set(t.nombre, {
                nombre: t.nombre,
                horas: totalHoras,
                turnos: totalShifts,
                promedio: totalShifts > 0 ? totalHoras / totalShifts : 0,
                detalles: detallesDias
            });
        });

        const staffStats = Array.from(staffStatsMap.values()).sort((a, b) => b.horas - a.horas);
        const totalStaffHours = staffStats.reduce((sum, s) => sum + s.horas, 0);

        // 6. FETCH ALL NOTES FROM THE MONTH
        const notes = await prisma.notaAdmin.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { fecha: 'asc' }
        });

        // 7. USE AI TO EXTRACT HOURS ADJUSTMENTS FROM NOTES
        let adjustedStaffStats = [...staffStats];

        if (notes.length > 0) {
            const adjustmentPrompt = `Eres un experto en análisis de texto para RRHH. Analiza las siguientes notas administrativas y extrae SOLO los ajustes de horas que deben aplicarse.

HORAS PLANIFICADAS ACTUALES:
${staffStats.map(s => `- ${s.nombre}: ${s.horas.toFixed(2)} horas`).join('\n')}

NOTAS DEL MES:
${notes.map(n => `[${format(new Date(n.fecha), 'dd/MM')}] ${n.titulo}: ${n.contenido}${n.trabajadorRelacionado ? ` (Trabajador: ${n.trabajadorRelacionado})` : ''}`).join('\n')}

INSTRUCCIONES:
Analiza cada nota y extrae SOLO los ajustes de horas que se mencionan explícitamente.
Responde ÚNICAMENTE con un JSON array en este formato exacto (sin texto adicional):
[
  {"trabajador": "Nombre Exacto", "ajuste": -6, "motivo": "ausencia"},
  {"trabajador": "Nombre Exacto", "ajuste": 2, "motivo": "horas extras"}
]

REGLAS CRÍTICAS:
- Si una nota dice "no vino", "ausente", "falta": calcula las horas del turno que perdió (mañana ~5h, tarde ~6h) y pon ajuste negativo
- Si dice "horas extras", "trabajó más": pon el número de horas extras como ajuste positivo
- Si dice "cambio de turno" sin ausencia: NO pongas ajuste (es solo reorganización)
- El nombre del trabajador debe coincidir EXACTAMENTE con los nombres de la lista de arriba
- Si no hay ajustes claros, responde con un array vacío: []
- NO incluyas explicaciones, SOLO el JSON

Responde AHORA con el JSON:`;

            try {
                const adjustmentResponse = await generateText(adjustmentPrompt);
                console.log('AI Adjustment Response:', adjustmentResponse);

                // Parse AI response
                const cleanResponse = adjustmentResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const adjustments = JSON.parse(cleanResponse);

                if (Array.isArray(adjustments) && adjustments.length > 0) {
                    // Apply adjustments to staffStats
                    adjustedStaffStats = staffStats.map(worker => {
                        const adjustment = adjustments.find(adj =>
                            adj.trabajador.toLowerCase().trim() === worker.nombre.toLowerCase().trim()
                        );

                        if (adjustment && typeof adjustment.ajuste === 'number') {
                            const adjustedHours = Math.max(0, worker.horas + adjustment.ajuste);
                            return {
                                ...worker,
                                horasOriginales: worker.horas,
                                horas: adjustedHours,
                                ajuste: adjustment.ajuste,
                                motivoAjuste: adjustment.motivo,
                                promedio: worker.turnos > 0 ? adjustedHours / worker.turnos : 0
                            };
                        }
                        return worker;
                    });

                    console.log('Adjustments applied:', adjustments);
                }
            } catch (error) {
                console.error('Error parsing AI adjustments:', error);
                // If AI fails, continue with original staffStats
                adjustedStaffStats = staffStats;
            }
        }

        const totalAdjustedHours = adjustedStaffStats.reduce((sum, s) => sum + s.horas, 0);

        // 8. GENERATE AI ANALYSIS WITH ADJUSTED HOURS
        const prompt = `Actúa como un **Experto en Gestión de RRHH especializado en control horario y productividad** para un negocio de heladería y cafetería ("Eva's Barcelona").

DATOS DE HORAS DEL MES DE ${format(startDate, 'MMMM yyyy', { locale: es })}:

RESUMEN POR TRABAJADOR (HORAS AJUSTADAS):
${adjustedStaffStats.map(s => {
            let line = `- ${s.nombre}: ${s.horas.toFixed(2)} horas (${s.turnos} turnos, promedio ${s.promedio.toFixed(2)}h/turno)`;
            if (s.ajuste) {
                line += ` [Ajuste: ${s.ajuste > 0 ? '+' : ''}${s.ajuste.toFixed(2)}h por ${s.motivoAjuste}]`;
            }
            return line;
        }).join('\n')}

Total de horas del equipo: ${totalAdjustedHours.toFixed(2)} horas

NOTAS E INCIDENCIAS DEL MES (${notes.length}):
${notes.length > 0 ? notes.map(n => `- [${format(new Date(n.fecha), 'dd/MM')}] ${n.titulo}: ${n.contenido}${n.trabajadorRelacionado ? ` (Trabajador: ${n.trabajadorRelacionado})` : ''}`).join('\n') : 'No hay notas registradas para este mes.'}


INSTRUCCIONES:
Genera un resumen MUY BREVE y directo en 3 puntos con viñetas (máximo 2-3 líneas cada uno):

• DISTRIBUCIÓN: ¿El reparto de horas es equilibrado? Señala solo lo destacable.
• INCIDENCIAS: Resume en 1-2 frases el impacto real de las notas del mes en las horas.
• ACCIÓN: Una recomendación concreta y práctica para el próximo mes.

Tono: directo, sin rodeos. Sin introducción ni conclusión. Responde SOLO los 3 puntos con viñeta (•).`;

        const aiAnalysis = await generateText(prompt);

        return NextResponse.json({
            staffStats: adjustedStaffStats,
            notes,
            aiAnalysis,
            totalHours: totalAdjustedHours,
            month,
            year,
            monthLabel: format(startDate, 'MMMM yyyy', { locale: es })
        });

    } catch (error) {
        console.error('Error generating hours report:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
    }
}
