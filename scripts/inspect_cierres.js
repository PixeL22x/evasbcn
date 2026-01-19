const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const start17 = new Date('2026-01-17T00:00:00.000Z')
    const end17 = new Date('2026-01-17T23:59:59.000Z')

    const start18 = new Date('2026-01-18T00:00:00.000Z')
    const end18 = new Date('2026-01-18T23:59:59.000Z')

    const cierres17 = await prisma.cierre.findMany({
        where: {
            fechaInicio: { gte: start17, lte: end17 },
            trabajador: { contains: 'Martina', mode: 'insensitive' }
        }
    })

    const cierres18 = await prisma.cierre.findMany({
        where: {
            fechaInicio: { gte: start18, lte: end18 },
            trabajador: { contains: 'Martina', mode: 'insensitive' }
        }
    })

    console.log('--- CIERRES 17 ENERO ---')
    console.log(cierres17)

    console.log('--- CIERRES 18 ENERO ---')
    console.log(cierres18)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
