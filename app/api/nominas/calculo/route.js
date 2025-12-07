
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const trabajadorId = searchParams.get('trabajadorId')
    const mes = parseInt(searchParams.get('mes') || new Date().getMonth() + 1)
    const anio = parseInt(searchParams.get('anio') || new Date().getFullYear())

    if (!trabajadorId) {
        return NextResponse.json({ error: 'Falta trabajadorId' }, { status: 400 })
    }

    try {
        // 1. Fetch Configuration (Shift Hours)
        // We look for the active profile or fallback to defaults
        const config = await prisma.configuracion.findUnique({
            where: { clave: 'horarios_active_profile' }
        })

        // Default Shifts if no config found (day-indexed: 0=Sunday, 6=Saturday)
        let SHIFTS = {
            M: {
                0: { hours: 5.5 }, 1: { hours: 4.5 }, 2: { hours: 4.5 },
                3: { hours: 4.5 }, 4: { hours: 4.5 }, 5: { hours: 4.5 }, 6: { hours: 5.5 }
            },
            T: {
                0: { hours: 6 }, 1: { hours: 6 }, 2: { hours: 6 },
                3: { hours: 6 }, 4: { hours: 6 }, 5: { hours: 6 }, 6: { hours: 6 }
            },
            L: {
                0: { hours: 0 }, 1: { hours: 0 }, 2: { hours: 0 },
                3: { hours: 0 }, 4: { hours: 0 }, 5: { hours: 0 }, 6: { hours: 0 }
            }
        }

        if (config?.valor?.shifts) {
            SHIFTS = config.valor.shifts
        }

        // 2. Fetch Planned Schedule (Reglas + Excepciones)
        // This logic mimics what is in getTurnoHorario but aggregated for the month
        const reglas = await prisma.reglaHorario.findMany({
            where: { trabajadorId }
        })

        const excepciones = await prisma.excepcionHorario.findMany({
            where: {
                trabajadorId,
                fecha: {
                    gte: new Date(Date.UTC(anio, mes - 1, 1)),
                    lt: new Date(Date.UTC(anio, mes, 1))
                }
            }
        })

        // Helper to get number of days in month
        const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()
        const daysInMonth = getDaysInMonth(anio, mes)

        let horasPlanificadas = 0
        let diasPlanificados = 0

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(Date.UTC(anio, mes - 1, day))
            const isoDate = date.toISOString().split('T')[0]
            const dayOfWeek = date.getUTCDay() // 0=Sun, 1=Mon...

            // Determine effective shift (Excepcion > Regla > Default 'L')
            let turno = 'L'

            // 1. Check Exception
            const excepcion = excepciones.find(e => e.fecha.toISOString().split('T')[0] === isoDate)
            if (excepcion) {
                turno = excepcion.turno
            } else {
                // 2. Check Rule
                // Prisma dayOfWeek: 0=Sun... Regla logic usually matches JS getDay()
                // IMPORTANT: My ReglaHorario model might use 1=Mon... need to verify.
                // Assuming standard 1-7 or 0-6. Let's assume matching JS getDay() for now or simple "dayOfWeek" int
                const regla = reglas.find(r => r.diaSemana === dayOfWeek)
                if (regla) turno = regla.turno
            }

            // Calculate Hours using day-indexed structure
            if (turno && SHIFTS[turno]) {
                // New day-indexed structure: SHIFTS[turno][dayOfWeek]
                const dayConfig = SHIFTS[turno][dayOfWeek]
                const hours = dayConfig?.hours || 0
                horasPlanificadas += hours
                if (hours > 0) diasPlanificados++
            }
        }

        // 3. Fetch Actual Hours (Registros)
        const registros = await prisma.registroHorario.findMany({
            where: {
                trabajadorId,
                fecha: {
                    gte: new Date(Date.UTC(anio, mes - 1, 1)),
                    lt: new Date(Date.UTC(anio, mes, 1))
                }
            }
        })

        let horasReales = 0
        registros.forEach(reg => {
            if (reg.entrada && reg.salida) {
                const diffMs = new Date(reg.salida) - new Date(reg.entrada)
                const hours = diffMs / (1000 * 60 * 60)
                horasReales += hours
            }
        })

        return NextResponse.json({
            horasPlanificadas,
            horasReales,
            diasPlanificados,
            balance: horasReales - horasPlanificadas,
            registrosCount: registros.length
        })

    } catch (error) {
        console.error("Error calculating payroll:", error)
        return NextResponse.json({ error: 'Error calculando nómina' }, { status: 500 })
    }
}
