// Script de migración para añadir "Aire acondicionado apagado" al Bloque 5.3
// Ejecutar con: node scripts/migrate-add-aire-acondicionado-block53.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Añade la foto "Aire acondicionado apagado" al Bloque 5.3 si no existe.
 * Actualiza tanto cierre_tasks_tarde como cierre_tasks_noche.
 */
async function addAireAcondicionado(configKey) {
    console.log(`\n🔍 Procesando configuración: ${configKey}`)

    const config = await prisma.configuracion.findUnique({
        where: { clave: configKey }
    })

    if (!config || !config.valor) {
        console.log(`⚠️  No se encontró configuración para "${configKey}". Se usará el default al próximo cierre.`)
        return false
    }

    const tasks = config.valor

    // Buscar Bloque 5.3
    const task53Index = tasks.findIndex(t =>
        t.nombre && t.nombre.includes('Bloque 5.3')
    )

    if (task53Index === -1) {
        console.log(`⚠️  No se encontró Bloque 5.3 en "${configKey}"`)
        return false
    }

    const task53 = tasks[task53Index]

    // Parsear fotos actuales
    let fotosActuales = []
    try {
        fotosActuales = JSON.parse(task53.fotosRequeridas || '[]')
    } catch (e) {
        console.log(`⚠️  Error parseando fotosRequeridas del Bloque 5.3`)
        return false
    }

    console.log(`📋 Fotos actuales en Bloque 5.3:`)
    fotosActuales.forEach(f => console.log(`   • ${f.descripcion} (${f.tipo})`))

    // Verificar si ya existe
    const yaExiste = fotosActuales.some(f => f.tipo === 'aire_apagado')
    if (yaExiste) {
        console.log(`✅ "Aire acondicionado apagado" ya existe en el Bloque 5.3 de "${configKey}". Sin cambios.`)
        return false
    }

    // Insertar después de "waflera_apagada" (posición 2) o al principio si no existe
    const wafleraIndex = fotosActuales.findIndex(f => f.tipo === 'waflera_apagada')
    const insertAt = wafleraIndex !== -1 ? wafleraIndex + 1 : 0

    const nuevaFoto = { tipo: 'aire_apagado', descripcion: 'Aire acondicionado apagado' }
    fotosActuales.splice(insertAt, 0, nuevaFoto)

    console.log(`\n📸 Fotos nuevas en Bloque 5.3 (después de la migración):`)
    fotosActuales.forEach(f => console.log(`   • ${f.descripcion} (${f.tipo})`))

    // Actualizar la tarea con las nuevas fotos
    tasks[task53Index] = {
        ...task53,
        fotosRequeridas: JSON.stringify(fotosActuales)
    }

    // Guardar en BD
    await prisma.configuracion.update({
        where: { clave: configKey },
        data: { valor: tasks }
    })

    console.log(`✅ Migración OK: "Aire acondicionado apagado" añadido al Bloque 5.3 de "${configKey}"`)
    return true
}

async function migrate() {
    console.log('🚀 Iniciando migración: Añadir "Aire acondicionado apagado" al Bloque 5.3...')

    try {
        const tardeMigrated  = await addAireAcondicionado('cierre_tasks_tarde')
        const nocheMigrated  = await addAireAcondicionado('cierre_tasks_noche')

        console.log('\n📊 Resumen:')
        console.log(`   cierre_tasks_tarde : ${tardeMigrated  ? '✅ Actualizado' : '⏭  Sin cambios'}`)
        console.log(`   cierre_tasks_noche : ${nocheMigrated  ? '✅ Actualizado' : '⏭  Sin cambios'}`)

    } catch (error) {
        console.error('❌ Error durante la migración:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

migrate()
    .then(() => {
        console.log('\n✅ Script completado exitosamente')
        console.log('💡 El Bloque 5.3 ahora incluye la foto del Aire acondicionado apagado')
        console.log('🔄 Recarga la app para que los trabajadores vean el cambio en el próximo cierre')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error)
        process.exit(1)
    })
