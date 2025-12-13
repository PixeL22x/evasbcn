const { PrismaClient } = require('@prisma/client')
const basePrisma = new PrismaClient()

// Middleware to simulate the logic used in the app (if any custom logic exists in the client extension)
// But for raw data inspection, base client is enough. 
// We will manually replicate the logic from route.js to debug it.

async function main() {
    const now = new Date()

    // 1. Time Info
    const timeFormatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'long',
        hour12: false
    })

    const parts = timeFormatter.formatToParts(now)
    const hour = parseInt(parts.find(p => p.type === 'hour').value)
    const minute = parseInt(parts.find(p => p.type === 'minute').value)
    const weekday = parts.find(p => p.type === 'weekday').value
    const currentTime = hour * 60 + minute

    console.log('--- TIME DEBUG ---')
    console.log('Server Date:', now.toISOString())
    console.log('Barcelona Time:', `${hour}:${minute}`)
    console.log('Minutes from midnight:', currentTime)
    console.log('Weekday:', weekday)

    // Logic from route.js
    const isWeekend = weekday === 'sábado' || weekday === 'domingo'
    const morningStart = isWeekend ? 690 : 753 // 11:30 or 12:30
    const morningEnd = 1020 // 17:00
    const eveningStart = 1020 // 17:00
    const eveningEnd = 1380 // 23:00

    let turnoActual = 'L'
    if (currentTime >= morningStart && currentTime < morningEnd) {
        turnoActual = 'M'
    } else if (currentTime >= eveningStart && currentTime < eveningEnd) {
        turnoActual = 'T'
    }

    console.log('Detected Shift (Calculated):', turnoActual)
    console.log('-------------------')

    // 2. Fetch Workers
    const trabajadores = await basePrisma.trabajador.findMany({
        where: { activo: true },
        include: {
            reglasHorario: true,
            excepcionesHorario: true
        }
    })

    console.log(`Found ${trabajadores.length} active workers. Checking assignment...`)

    const mapDayToEn = {
        'lunes': 'MONDAY', 'martes': 'TUESDAY', 'miércoles': 'WEDNESDAY',
        'jueves': 'THURSDAY', 'viernes': 'FRIDAY', 'sábado': 'SATURDAY', 'domingo': 'SUNDAY'
    }
    const dbDay = mapDayToEn[weekday.toLowerCase()] || 'UNKNOWN'
    console.log('Mapping JS day', weekday, 'to DB day', dbDay)

    const todayStr = now.toISOString().split('T')[0] // simplified date match

    for (const t of trabajadores) {
        console.log(`\nWorker: ${t.nombre} (ID: ${t.id})`)

        // Check Exceptions
        const exception = t.excepcionesHorario.find(e => {
            // Compare dates (ignoring time)
            const eDate = e.fecha.toISOString().split('T')[0]
            return eDate === todayStr
        })

        if (exception) {
            console.log(`  -> Exception found for today: Turno ${exception.turno}`)
            if (exception.turno === turnoActual) console.log('  *** MATCH FOUND VIA EXCEPTION ***')
        } else {
            console.log('  -> No exception for today.')
            // Check Rules
            const rule = t.reglasHorario.find(r => r.diaSemana === dbDay) // Note: This depends on how diaSemana is stored in DB
            if (rule) {
                console.log(`  -> Weekly Rule for ${dbDay}: Turno ${rule.turno}`)
                if (rule.turno === turnoActual) console.log('  *** MATCH FOUND VIA RULE ***')
            } else {
                console.log(`  -> No rule found for ${dbDay}. Available rules:`, t.reglasHorario.map(r => r.diaSemana).join(', '))
            }
        }
    }

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await basePrisma.$disconnect()
    })
