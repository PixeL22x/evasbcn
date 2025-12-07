const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDecember() {
    const count = await prisma.excepcionHorario.count({
        where: {
            fecha: {
                gte: new Date('2024-12-01'),
                lt: new Date('2025-01-01')
            }
        }
    })

    console.log('Total asignaciones en diciembre 2024:', count)

    const sample = await prisma.excepcionHorario.findMany({
        where: {
            fecha: {
                gte: new Date('2024-12-01'),
                lt: new Date('2025-01-01')
            }
        },
        take: 10,
        include: { trabajador: true },
        orderBy: { fecha: 'asc' }
    })

    console.log('\nPrimeras 10 asignaciones:')
    sample.forEach(a => {
        const date = a.fecha.toISOString().slice(0, 10)
        console.log(`  ${date} - ${a.trabajador.nombre}: ${a.turno}`)
    })

    await prisma.$disconnect()
}

checkDecember()
