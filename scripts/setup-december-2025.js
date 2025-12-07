// Script to configure December 2025 schedule
// Run with: node scripts/setup-december-2025.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Configurando horario de Diciembre 2025...\n')

    // 1. Configure base schedule (hours for M and T per day of week)
    const scheduleConfig = {
        profileName: 'Diciembre 2025',
        shifts: {
            M: {
                0: { hours: 6, start: '11:00', end: '17:00' },      // Domingo
                1: { hours: 0, start: '00:00', end: '00:00' },      // Lunes (no hay mañana)
                2: { hours: 0, start: '00:00', end: '00:00' },      // Martes (no hay mañana)
                3: { hours: 0, start: '00:00', end: '00:00' },      // Miércoles (no hay mañana)
                4: { hours: 4.5, start: '12:30', end: '17:00' },    // Jueves
                5: { hours: 4, start: '13:00', end: '17:00' },      // Viernes
                6: { hours: 5.5, start: '11:30', end: '17:00' }     // Sábado
            },
            T: {
                0: { hours: 6, start: '17:00', end: '23:00' },      // Domingo
                1: { hours: 7.5, start: '15:00', end: '22:30' },    // Lunes
                2: { hours: 7.5, start: '15:00', end: '22:30' },    // Martes
                3: { hours: 7.5, start: '15:00', end: '22:30' },    // Miércoles
                4: { hours: 6, start: '17:00', end: '23:00' },      // Jueves
                5: { hours: 6, start: '17:00', end: '23:00' },      // Viernes
                6: { hours: 6, start: '17:00', end: '23:00' }       // Sábado
            }
        }
    }

    await prisma.configuracion.upsert({
        where: { clave: 'horarios_active_profile' },
        update: { valor: scheduleConfig },
        create: { clave: 'horarios_active_profile', valor: scheduleConfig }
    })

    console.log('✅ Configuración base guardada\n')

    // 2. Get workers
    const piero = await prisma.trabajador.findFirst({ where: { nombre: { contains: 'Piero', mode: 'insensitive' } } })
    const sheila = await prisma.trabajador.findFirst({ where: { nombre: { contains: 'Sheila', mode: 'insensitive' } } })
    const martina = await prisma.trabajador.findFirst({ where: { nombre: { contains: 'Martina', mode: 'insensitive' } } })

    if (!piero || !sheila || !martina) {
        console.log('⚠️  No se encontraron todos los trabajadores (Piero, Sheila, Martina)')
        console.log('Trabajadores encontrados:', { piero: !!piero, sheila: !!sheila, martina: !!martina })
        return
    }

    console.log('👥 Trabajadores encontrados:')
    console.log(`   - Piero (${piero.id})`)
    console.log(`   - Sheila (${sheila.id})`)
    console.log(`   - Martina (${martina.id})\n`)

    // 3. Create December 2025 planning
    const dayOfWeekPattern = {
        1: [{ worker: sheila.id, turno: 'T' }],                           // Lunes
        2: [{ worker: piero.id, turno: 'T' }],                            // Martes
        3: [{ worker: piero.id, turno: 'T' }],                            // Miércoles
        4: [{ worker: piero.id, turno: 'M' }, { worker: sheila.id, turno: 'T' }],  // Jueves
        5: [{ worker: piero.id, turno: 'M' }, { worker: sheila.id, turno: 'T' }],  // Viernes
        6: [{ worker: piero.id, turno: 'M' }, { worker: martina.id, turno: 'T' }], // Sábado
        0: [{ worker: sheila.id, turno: 'M' }, { worker: martina.id, turno: 'T' }] // Domingo
    }

    // Generate all days in December 2025
    const year = 2025
    const month = 12
    const daysInMonth = new Date(year, month, 0).getDate()

    let createdCount = 0
    let updatedCount = 0

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month - 1, day))
        const dayOfWeek = date.getUTCDay()

        const assignments = dayOfWeekPattern[dayOfWeek]

        if (assignments) {
            for (const assignment of assignments) {
                const existing = await prisma.excepcionHorario.findFirst({
                    where: {
                        trabajadorId: assignment.worker,
                        fecha: date
                    }
                })

                if (existing) {
                    await prisma.excepcionHorario.update({
                        where: { id: existing.id },
                        data: { turno: assignment.turno }
                    })
                    updatedCount++
                } else {
                    await prisma.excepcionHorario.create({
                        data: {
                            trabajadorId: assignment.worker,
                            fecha: date,
                            turno: assignment.turno
                        }
                    })
                    createdCount++
                }
            }
        }
    }

    console.log(`✅ Planning de Diciembre 2025 creado:`)
    console.log(`   - ${createdCount} asignaciones nuevas`)
    console.log(`   - ${updatedCount} asignaciones actualizadas`)
    console.log(`\n🎉 ¡Listo! Refresca la página y ve a Horarios > Hacer Planning (Diciembre 2025)`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
