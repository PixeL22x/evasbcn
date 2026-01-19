const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const start = new Date('2026-01-16T00:00:00.000Z')
    const end = new Date('2026-01-19T23:59:59.000Z')

    const cierres = await prisma.cierre.findMany({
        where: {
            fechaInicio: {
                gte: start,
                lte: end
            },
            trabajador: {
                contains: 'Martina',
                mode: 'insensitive'
            }
        },
        include: {
            tareas: true
        }
    })

    console.log('Cierres encontrados:', JSON.stringify(cierres, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
