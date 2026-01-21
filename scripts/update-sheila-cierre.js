const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateSheilaCierre() {
    try {
        // Buscar el último cierre de tarde de Sheila
        const cierres = await prisma.cierre.findMany({
            where: {
                trabajador: {
                    contains: 'Sheila',
                    mode: 'insensitive'
                },
                turno: 'tarde'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 1
        })

        if (cierres.length === 0) {
            console.log('❌ No se encontró ningún cierre de tarde de Sheila')
            return
        }

        const cierre = cierres[0]
        console.log('📋 Cierre encontrado:')
        console.log(`  ID: ${cierre.id}`)
        console.log(`  Trabajador: ${cierre.trabajador}`)
        console.log(`  Turno: ${cierre.turno}`)
        console.log(`  Fecha actual: ${cierre.fechaInicio}`)

        // Nueva fecha: 19 de enero de 2026
        const nuevaFecha = new Date('2026-01-19T20:00:00.000Z') // 20:00 UTC = 21:00 CET

        // Actualizar el cierre
        const updated = await prisma.cierre.update({
            where: { id: cierre.id },
            data: {
                fechaInicio: nuevaFecha,
                updatedAt: new Date()
            }
        })

        console.log('\n✅ Cierre actualizado exitosamente:')
        console.log(`  Nueva fecha: ${updated.fechaInicio}`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateSheilaCierre()
