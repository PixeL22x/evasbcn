const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function revertSheilaCierreVentas() {
    try {
        // Revertir a las ventas originales
        const updated = await prisma.cierre.update({
            where: { id: '696fe6b1b829ac65bed2abab' },
            data: {
                totalVentas: 108.80,
                updatedAt: new Date()
            }
        })

        console.log('✅ Ventas revertidas a €108.80')
        console.log(`  Fecha: ${updated.fechaInicio}`)
        console.log(`  Ventas: €${updated.totalVentas}`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

revertSheilaCierreVentas()
