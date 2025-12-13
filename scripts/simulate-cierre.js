/**
 * Script para simular un cierre completo y probar la notificación de Telegram
 * Crea un cierre, lo completa, y dispara la notificación
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function simularCierre() {
    console.log('🧪 Simulando cierre completo...\n')

    try {
        // 1. Crear un cierre de prueba
        console.log('📝 Creando cierre de prueba...')
        const cierre = await prisma.cierre.create({
            data: {
                trabajador: 'Test Simulado',
                turno: 'tarde',
                tareas: {
                    create: [
                        {
                            nombre: 'Tarea de prueba 1',
                            duracion: 1,
                            completada: false
                        },
                        {
                            nombre: 'Tarea de prueba 2',
                            duracion: 1,
                            completada: false
                        }
                    ]
                }
            },
            include: {
                tareas: true
            }
        })

        console.log('✅ Cierre creado:', cierre.id)
        console.log('   Trabajador:', cierre.trabajador)
        console.log('   Turno:', cierre.turno)
        console.log('   Tareas:', cierre.tareas.length)
        console.log('')

        // 2. Completar cada tarea (esto dispara la lógica de /api/tarea)
        console.log('⏳ Completando tareas...')

        for (const tarea of cierre.tareas) {
            console.log(`   ✓ Completando: ${tarea.nombre}`)

            // Llamar al endpoint de tarea para simular la app real
            const response = await fetch('http://localhost:3000/api/tarea', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tareaId: tarea.id,
                    completada: true,
                    cierreId: cierre.id
                })
            })

            if (!response.ok) {
                console.error('     ❌ Error completando tarea:', await response.text())
            }
        }

        console.log('')
        console.log('✅ Todas las tareas completadas')
        console.log('')

        // 3. Verificar que el cierre se marcó como completado
        const cierreActualizado = await prisma.cierre.findUnique({
            where: { id: cierre.id },
            include: { tareas: true }
        })

        console.log('📊 Estado final del cierre:')
        console.log('   ID:', cierreActualizado.id)
        console.log('   Completado:', cierreActualizado.completado ? '✅ Sí' : '❌ No')
        console.log('   Fecha fin:', cierreActualizado.fechaFin)
        console.log('   Ventas:', cierreActualizado.totalVentas || 0)
        console.log('')

        if (cierreActualizado.completado) {
            console.log('🎉 ¡Cierre completado exitosamente!')
            console.log('📱 Revisa tu Telegram - deberías haber recibido:')
            console.log('   1. Mensaje de cierre completado')
            console.log('   2. Botón "📊 Ver Detalles"')
            console.log('   3. Al presionar el botón, abre /admin/cierres')
        } else {
            console.log('⚠️ El cierre no se marcó como completado')
            console.log('   Verifica que todas las tareas estén completadas')
        }

        console.log('')
        console.log('🧹 Limpiando cierre de prueba...')
        await prisma.cierre.delete({
            where: { id: cierre.id }
        })
        console.log('✅ Cierre eliminado')

    } catch (error) {
        console.error('❌ Error:', error.message)
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

simularCierre()
