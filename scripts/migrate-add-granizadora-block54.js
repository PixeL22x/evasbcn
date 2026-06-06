// Script de migración para añadir "Bloque 5.4 - Apagado de granizadora" a los cierres
// Ejecutar con: node scripts/migrate-add-granizadora-block54.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const NUEVO_BLOQUE = {
  nombre: '🧊 Bloque 5.4 - Apagado de granizadora',
  duracion: 1,
  requiereInput: true,
  inputType: 'pulsacion',
  subtareas: JSON.stringify([
    { id: 'granizadora', nombre: 'Granizadora' }
  ])
}

async function addGranizadora(configKey) {
  console.log(`\n🔍 Procesando configuración: ${configKey}`)

  const config = await prisma.configuracion.findUnique({
    where: { clave: configKey }
  })

  if (!config || !config.valor) {
    console.log(`⚠️  No se encontró configuración para "${configKey}". Se usará el default en el próximo cierre.`)
    return false
  }

  const tasks = config.valor

  // Verificar si ya existe el Bloque 5.4
  const yaExiste = tasks.some(t => t.nombre && t.nombre.includes('Bloque 5.4'))
  if (yaExiste) {
    console.log(`✅ Bloque 5.4 ya existe en "${configKey}". Sin cambios.`)
    return false
  }

  // Insertar después del Bloque 5.3
  const idx53 = tasks.findIndex(t => t.nombre && t.nombre.includes('Bloque 5.3'))
  const insertAt = idx53 !== -1 ? idx53 + 1 : tasks.length

  console.log(`📋 Tareas actuales: ${tasks.length}`)
  console.log(`➕ Insertando Bloque 5.4 en posición ${insertAt} (después del Bloque 5.3)`)

  tasks.splice(insertAt, 0, NUEVO_BLOQUE)

  await prisma.configuracion.update({
    where: { clave: configKey },
    data: { valor: tasks }
  })

  console.log(`✅ Migración OK: "Bloque 5.4 - Apagado de granizadora" añadido a "${configKey}"`)
  return true
}

async function migrate() {
  console.log('🚀 Iniciando migración: Añadir Bloque 5.4 - Granizadora...')

  try {
    const tardeMigrated = await addGranizadora('cierre_tasks_tarde')
    const nocheMigrated = await addGranizadora('cierre_tasks_noche')

    console.log('\n📊 Resumen:')
    console.log(`   cierre_tasks_tarde : ${tardeMigrated ? '✅ Actualizado' : '⏭  Sin cambios'}`)
    console.log(`   cierre_tasks_noche : ${nocheMigrated ? '✅ Actualizado' : '⏭  Sin cambios'}`)
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
  .then(() => {
    console.log('\n✅ Script completado')
    console.log('🧊 Bloque 5.4 - Granizadora añadido. El próximo cierre mostrará el botón de pulsación.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
