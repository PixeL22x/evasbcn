
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const defaultShifts = {
        M: {
            label: 'Mañana',
            hours: 4.5,
            hoursWeekend: 5.5,
            start: '12:30',
            end: '17:00',
            startWeekend: '11:30',
            endWeekend: '17:00',
        },
        T: {
            label: 'Tarde',
            hours: 6,
            hoursWeekend: 6,
            start: '17:00',
            end: '23:00',
            startWeekend: '17:00',
            endWeekend: '23:00',
        }
    }

    const seasonalConfig = {
        profileName: "Horario Estándar (Invierno)",
        shifts: defaultShifts
    }

    console.log('Seeding configuration...')

    await prisma.configuracion.upsert({
        where: { clave: 'horarios_active_profile' },
        update: { valor: seasonalConfig },
        create: {
            clave: 'horarios_active_profile',
            valor: seasonalConfig
        }
    })

    console.log('Configuration seeded successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
