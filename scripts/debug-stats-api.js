const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Simular la lógica de getBarcelonaTimeInfo
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

async function testStatsAPI() {
    try {
        console.log('🔍 Testing Stats API Logic...\n')

        const timeInfo = getBarcelonaTimeInfo()
        const { today, dayOfWeek, timeInMinutes, isWeekend } = timeInfo

        console.log('📅 Time Info:')
        console.log(`   Today: ${today}`)
        console.log(`   Day of Week: ${dayOfWeek} (${isWeekend ? 'Weekend' : 'Weekday'})`)
        console.log(`   Current Time: ${Math.floor(timeInMinutes / 60)}:${timeInMinutes % 60} (${timeInMinutes} minutes)`)
        console.log('')

        // Test 1: Count active workers
        console.log('👥 Test 1: Counting active workers...')
        const totalTrabajadores = await prisma.trabajador.count({
            where: { activo: true }
        })
        console.log(`   ✅ Active workers: ${totalTrabajadores}`)
        console.log('')

        // Test 2: Get current shift worker
        console.log('🕐 Test 2: Getting current shift worker...')

        // Determine current shift
        let turnoActual = 'L'
        const morningStart = isWeekend ? 690 : 753
        const morningEnd = 1020
        const eveningStart = 1020
        const eveningEnd = 1380

        if (timeInMinutes >= morningStart && timeInMinutes < morningEnd) {
            turnoActual = 'M'
        } else if (timeInMinutes >= eveningStart && timeInMinutes < eveningEnd) {
            turnoActual = 'T'
        }

        console.log(`   Current Shift: ${turnoActual} (${turnoActual === 'M' ? 'Mañana' : turnoActual === 'T' ? 'Tarde' : 'Libre'})`)

        if (turnoActual === 'L') {
            console.log('   ⚠️  No active shift right now')
        } else {
            // Find workers
            const trabajadores = await prisma.trabajador.findMany({
                where: { activo: true },
                include: {
                    reglasHorario: true,
                    excepcionesHorario: true
                }
            })

            console.log(`   Found ${trabajadores.length} active workers`)

            let found = false
            for (const trabajador of trabajadores) {
                let turnoAsignado = null

                // Check exceptions first
                const excepcionHoy = trabajador.excepcionesHorario.find(exc =>
                    exc.fecha.toISOString().split('T')[0] === today
                )

                if (excepcionHoy) {
                    turnoAsignado = excepcionHoy.turno
                    console.log(`   ${trabajador.nombre}: Exception found - Turno ${turnoAsignado}`)
                } else {
                    // Check weekly rules
                    const reglaHoy = trabajador.reglasHorario.find(regla => regla.diaSemana === dayOfWeek)
                    if (reglaHoy) {
                        turnoAsignado = reglaHoy.turno
                        console.log(`   ${trabajador.nombre}: Weekly rule - Turno ${turnoAsignado} (day ${dayOfWeek})`)
                    } else {
                        console.log(`   ${trabajador.nombre}: No rule for day ${dayOfWeek}`)
                    }
                }

                if (turnoAsignado === turnoActual) {
                    console.log(`   ✅ MATCH: ${trabajador.nombre} is assigned to current shift!`)
                    found = true
                }
            }

            if (!found) {
                console.log(`   ⚠️  No worker assigned to current shift ${turnoActual}`)
            }
        }

        console.log('\n✅ Test completed')

    } catch (error) {
        console.error('❌ Error:', error)
        console.error('Stack:', error.stack)
    } finally {
        await prisma.$disconnect()
    }
}

testStatsAPI()
