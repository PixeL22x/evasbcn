// Script de migración para eliminar foto "ticket_ventas" del Bloque 5.1
// Ejecutar con: node scripts/migrate-remove-ticket-ventas.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
    console.log('🚀 Iniciando migración: Eliminar foto "ticket_ventas" del Bloque 5.1...')

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

        // Buscar Bloque 5.1
        const task51Index = tasks.findIndex(t =>
            t.nombre && t.nombre.includes('Bloque 5.1')
        )

        if (task51Index === -1) {
            console.log('⚠️  No se encontró Bloque 5.1')
            return
        }

        const task51 = tasks[task51Index]

        if (!task51.fotosRequeridas) {
            console.log('⚠️  Bloque 5.1 no tiene fotos requeridas')
            return
        }

        // Parsear fotos
        let fotos
        try {
            fotos = JSON.parse(task51.fotosRequeridas)
        } catch (e) {
            console.error('❌ Error al parsear fotosRequeridas:', e)
            return
        }

        // Filtrar foto de ticket_ventas
        const fotosOriginales = fotos.length
        const fotosActualizadas = fotos.filter(f => f.tipo !== 'ticket_ventas')

        if (fotosOriginales === fotosActualizadas.length) {
            console.log('✅ La foto "ticket_ventas" ya no está en la configuración')
            return
        }

        // Actualizar tarea
        tasks[task51Index].fotosRequeridas = JSON.stringify(fotosActualizadas)

        // Guardar en BD
        await prisma.configuracion.update({
            where: { clave: 'cierre_tasks_tarde' },
            data: { valor: tasks }
        })

        console.log(`✅ Migración completada: Eliminada foto "ticket_ventas" del Bloque 5.1`)
        console.log(`   Fotos antes: ${fotosOriginales}, Fotos después: ${fotosActualizadas.length}`)

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
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error)
        process.exit(1)
    })
