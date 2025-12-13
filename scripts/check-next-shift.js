const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function getBarcelonaTimeInfo() {
    const now = new Date()
    const barcelonaTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
    const currentHour = barcelonaTime.getHours()
    const currentMinute = barcelonaTime.getMinutes()
    const currentTime = currentHour * 60 + currentMinute
    const dayOfWeek = barcelonaTime.getDay()
    const today = barcelonaTime.toISOString().split('T')[0]

    return {
        date: barcelonaTime,
        hour: currentHour,
        minute: currentMinute,
        timeInMinutes: currentTime,
        dayOfWeek,
        today,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    }
}

async function checkNextShift() {
    try {
        const timeInfo = getBarcelonaTimeInfo()
        const { today, dayOfWeek, timeInMinutes, isWeekend } = timeInfo

        console.log('📅 Hoy:', today)
        console.log('🕐 Hora actual:', `${Math.floor(timeInMinutes / 60)}:${String(timeInMinutes % 60).padStart(2, '0')}`)
        console.log('')

        // Determine current and next shift
        const morningStart = isWeekend ? 690 : 753 // 11:30 or 12:30
        const morningEnd = 1020 // 17:00
        const eveningStart = 1020 // 17:00
        const eveningEnd = 1380 // 23:00

        let currentShift = 'L'
        let nextShift = null

        if (timeInMinutes >= morningStart && timeInMinutes < morningEnd) {
            currentShift = 'M'
            nextShift = 'T' // Next is evening
        } else if (timeInMinutes >= eveningStart && timeInMinutes < eveningEnd) {
            currentShift = 'T'
            nextShift = null // No more shifts today
        } else if (timeInMinutes < morningStart) {
            currentShift = 'L'
            nextShift = 'M' // Next is morning
        } else {
            currentShift = 'L'
            nextShift = null // Day is over
        }

        console.log('🔄 Turno actual:', currentShift === 'M' ? 'Mañana' : currentShift === 'T' ? 'Tarde' : 'Libre')

        if (!nextShift) {
            console.log('⏰ Siguiente turno: No hay más turnos hoy')
            return
        }

        console.log('⏰ Siguiente turno:', nextShift === 'M' ? 'Mañana (12:30-17:00)' : 'Tarde (17:00-23:00)')
        console.log('')

        // Find workers
        const trabajadores = await prisma.trabajador.findMany({
            where: { activo: true },
            include: {
                reglasHorario: true,
                excepcionesHorario: true
            }
        })

        console.log('👥 Buscando trabajador asignado al siguiente turno...\n')

        for (const trabajador of trabajadores) {
            let turnoAsignado = null

            // Check exceptions first
            const excepcionHoy = trabajador.excepcionesHorario.find(exc =>
                exc.fecha.toISOString().split('T')[0] === today
            )

            if (excepcionHoy) {
                turnoAsignado = excepcionHoy.turno
            } else {
                // Check weekly rules
                const reglaHoy = trabajador.reglasHorario.find(regla => regla.diaSemana === dayOfWeek)
                if (reglaHoy) {
                    turnoAsignado = reglaHoy.turno
                }
            }

            if (turnoAsignado === nextShift) {
                console.log('✅ SIGUIENTE TURNO:')
                console.log(`   👤 Trabajador: ${trabajador.nombre}`)
                console.log(`   🕐 Turno: ${nextShift === 'M' ? 'Mañana' : 'Tarde'}`)
                console.log(`   ⏰ Horario: ${nextShift === 'M' ? (isWeekend ? '11:30' : '12:30') + '-17:00' : '17:00-23:00'}`)
                return
            }
        }

        console.log('⚠️  No hay trabajador asignado al siguiente turno')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkNextShift()
