const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCierresEnero() {
    try {
        // Buscar todos los cierres entre el 19 y 21 de enero
        const cierres = await prisma.cierre.findMany({
            where: {
                fechaInicio: {
                    gte: new Date('2026-01-19T00:00:00.000Z'),
                    lte: new Date('2026-01-21T23:59:59.999Z')
                }
            },
            orderBy: {
                fechaInicio: 'asc'
            }
        })

        console.log(`\n📊 Cierres encontrados: ${cierres.length}\n`)

        cierres.forEach((cierre, index) => {
            const fecha = new Date(cierre.fechaInicio)
            const dia = fecha.getDate()
            const mes = fecha.getMonth() + 1
            const hora = fecha.toLocaleTimeString('es-ES')

            console.log(`${index + 1}. ID: ${cierre.id}`)
            console.log(`   Trabajador: ${cierre.trabajador}`)
            console.log(`   Turno: ${cierre.turno}`)
            console.log(`   Fecha: ${dia}/${mes}/2026 ${hora}`)
            console.log(`   Ventas: €${cierre.totalVentas || 0}`)
            console.log(`   Completado: ${cierre.completado ? 'Sí' : 'No'}`)
            console.log('')
        })

        // Agrupar por día
        const porDia = {}
        cierres.forEach(cierre => {
            const fecha = new Date(cierre.fechaInicio)
            const dia = fecha.getDate()
            if (!porDia[dia]) {
                porDia[dia] = { total: 0, cierres: [] }
            }
            porDia[dia].total += cierre.totalVentas || 0
            porDia[dia].cierres.push({
                trabajador: cierre.trabajador,
                turno: cierre.turno,
                ventas: cierre.totalVentas || 0
            })
        })

        console.log('📈 Resumen por día:')
        Object.keys(porDia).sort().forEach(dia => {
            console.log(`\n  Día ${dia}/01/2026: €${porDia[dia].total.toFixed(2)}`)
            porDia[dia].cierres.forEach(c => {
                console.log(`    - ${c.trabajador} (${c.turno}): €${c.ventas}`)
            })
        })

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkCierresEnero()
