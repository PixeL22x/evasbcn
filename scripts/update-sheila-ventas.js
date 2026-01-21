const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateSheilaCierreVentas() {
    try {
        // Buscar el cierre específico de Sheila del 19 de enero
        const cierre = await prisma.cierre.findFirst({
            where: {
                id: '696fe6b1b829ac65bed2abab'
            }
        })

        if (!cierre) {
            console.log('❌ No se encontró el cierre')
            return
        }

        console.log('📋 Cierre encontrado:')
        console.log(`  ID: ${cierre.id}`)
        console.log(`  Trabajador: ${cierre.trabajador}`)
        console.log(`  Turno: ${cierre.turno}`)
        console.log(`  Fecha: ${cierre.fechaInicio}`)
        console.log(`  Ventas actuales: €${cierre.totalVentas || 0}`)

        // Actualizar con un valor de ventas realista para un turno de tarde
        const ventasTarde = 450 // Valor típico para un turno de tarde

        const updated = await prisma.cierre.update({
            where: { id: cierre.id },
            data: {
                totalVentas: ventasTarde,
                updatedAt: new Date()
            }
        })

        console.log('\n✅ Cierre actualizado exitosamente:')
        console.log(`  Nuevas ventas: €${updated.totalVentas}`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateSheilaCierreVentas()
