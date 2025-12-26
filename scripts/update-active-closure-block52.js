// Script para buscar y actualizar el cierre más reciente
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findAndUpdateClosure() {
    console.log('🔍 Buscando cierre más reciente...')

    try {
        // Buscar el cierre más reciente (con o sin fechaFin)
        const recentClosure = await prisma.cierre.findFirst({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                tareas: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        })

        if (!recentClosure) {
            console.log('❌ No se encontró ningún cierre')
            return
        }

        console.log(`\n📋 Cierre más reciente:`)
        console.log(`   ID: ${recentClosure.id}`)
        console.log(`   Trabajador: ${recentClosure.trabajador}`)
        console.log(`   Turno: ${recentClosure.turno}`)
        console.log(`   Creado: ${recentClosure.createdAt}`)
        console.log(`   Finalizado: ${recentClosure.fechaFin || 'NO (en progreso)'}`)
        console.log(`   Total tareas: ${recentClosure.tareas.length}`)

        // Buscar Bloque 5.2
        const task52 = recentClosure.tareas.find(t =>
            t.nombre && (t.nombre.includes('5.2') || t.nombre.includes('ventas'))
        )

        if (!task52) {
            console.log('\n⚠️  No se encontró Bloque 5.2')
            console.log('Tareas disponibles:')
            recentClosure.tareas.forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.nombre}`)
            })
            return
        }

        console.log(`\n📋 Bloque 5.2 encontrado:`)
        console.log(`   ID: ${task52.id}`)
        console.log(`   Nombre: ${task52.nombre}`)
        console.log(`   Completada: ${task52.completada}`)
        console.log(`   requiereInput: ${task52.requiereInput}`)
        console.log(`   inputType: ${task52.inputType}`)
        console.log(`   requiereEscaneo: ${task52.requiereEscaneo}`)
        console.log(`   duracion: ${task52.duracion}`)

        if (task52.requiereEscaneo === true) {
            console.log('\n✅ Ya tiene requiereEscaneo: true')
            return
        }

        if (task52.completada) {
            console.log('\n⚠️  La tarea ya está completada, no se puede actualizar')
            return
        }

        // Actualizar
        console.log('\n🔄 Actualizando tarea...')
        await prisma.tarea.update({
            where: { id: task52.id },
            data: {
                nombre: '💰 Bloque 5.2 - Escanea el ticket de ventas del día',
                duracion: 3,
                requiereEscaneo: true
            }
        })

        console.log('✅ Tarea actualizada exitosamente!')
        console.log('\n💡 IMPORTANTE: Recarga la página del cierre (F5) para ver los cambios')

    } catch (error) {
        console.error('\n❌ Error:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

findAndUpdateClosure()
