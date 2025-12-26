// Script de migración para actualizar Bloque 5.2 con escaneo de IA
// Ejecutar con: node scripts/migrate-update-block52-ai.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
    console.log('🚀 Iniciando migración: Actualizar Bloque 5.2 con escaneo de IA...')

    try {
        // Buscar configuración de tareas de tarde
        const config = await prisma.configuracion.findUnique({
            where: { clave: 'cierre_tasks_tarde' }
        })

        if (!config || !config.valor) {
            console.log('⚠️  No se encontró configuración de tareas de tarde')
            return
        }

        const tasks = config.valor

        // Buscar Bloque 5.2
        const task52Index = tasks.findIndex(t =>
            t.nombre && (t.nombre.includes('Bloque 5.2') || t.nombre.includes('ventas del día'))
        )

        if (task52Index === -1) {
            console.log('⚠️  No se encontró Bloque 5.2')
            return
        }

        const task52 = tasks[task52Index]

        console.log('📋 Bloque 5.2 actual:', {
            nombre: task52.nombre,
            duracion: task52.duracion,
            requiereInput: task52.requiereInput,
            inputType: task52.inputType,
            requiereEscaneo: task52.requiereEscaneo
        })

        // Actualizar Bloque 5.2 con campos de IA
        tasks[task52Index] = {
            ...task52,
            nombre: '💰 Bloque 5.2 - Escanea el ticket de ventas del día',
            duracion: 3,
            requiereInput: true,
            inputType: 'ventas',
            requiereEscaneo: true
        }

        // Guardar en BD
        await prisma.configuracion.update({
            where: { clave: 'cierre_tasks_tarde' },
            data: { valor: tasks }
        })

        console.log('✅ Migración completada: Bloque 5.2 actualizado con escaneo de IA')
        console.log('📋 Bloque 5.2 nuevo:', {
            nombre: tasks[task52Index].nombre,
            duracion: tasks[task52Index].duracion,
            requiereInput: tasks[task52Index].requiereInput,
            inputType: tasks[task52Index].inputType,
            requiereEscaneo: tasks[task52Index].requiereEscaneo
        })

    } catch (error) {
        console.error('❌ Error durante la migración:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Ejecutar migración
migrate()
    .then(() => {
        console.log('✅ Script completado exitosamente')
        console.log('💡 Ahora el Bloque 5.2 usará el escaneo de tickets con IA')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error)
        process.exit(1)
    })
