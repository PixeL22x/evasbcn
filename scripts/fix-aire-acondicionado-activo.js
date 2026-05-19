// Script para inspeccionar y forzar aire_apagado activo en el Bloque 5.3
// node scripts/fix-aire-acondicionado-activo.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixTurno(clave) {
    console.log(`\n🔍 Revisando: ${clave}`)

    const config = await prisma.configuracion.findUnique({ where: { clave } })

    if (!config || !config.valor) {
        console.log(`  ⚠️  No existe configuración para ${clave}`)
        return
    }

    const tasks = config.valor
    const idx53 = tasks.findIndex(t => t.nombre && t.nombre.includes('5.3'))

    if (idx53 === -1) {
        console.log(`  ⚠️  No se encontró Bloque 5.3 en ${clave}`)
        return
    }

    const t53 = tasks[idx53]
    let fotos = []
    try {
        fotos = JSON.parse(t53.fotosRequeridas || '[]')
    } catch (e) {
        console.log(`  ❌ Error parseando fotosRequeridas`)
        return
    }

    console.log(`  📸 Fotos actuales en Bloque 5.3:`)
    fotos.forEach(f => console.log(`     - ${f.tipo} | activa: ${f.activa} | desc: ${f.descripcion}`))

    // Verificar si aire_apagado existe
    const aireIdx = fotos.findIndex(f => f.tipo === 'aire_apagado')

    if (aireIdx === -1) {
        // No existe — insertar después de waflera_apagada
        const wafleraIdx = fotos.findIndex(f => f.tipo === 'waflera_apagada')
        const insertAt = wafleraIdx !== -1 ? wafleraIdx + 1 : fotos.length
        fotos.splice(insertAt, 0, {
            tipo: 'aire_apagado',
            descripcion: 'Aire acondicionado apagado',
            activa: true
        })
        console.log(`  ➕ "Aire acondicionado apagado" AÑADIDO en posición ${insertAt}`)
    } else if (fotos[aireIdx].activa === false) {
        // Existe pero inactivo — activar
        fotos[aireIdx].activa = true
        console.log(`  ✅ "Aire acondicionado apagado" ACTIVADO (estaba inactivo)`)
    } else {
        console.log(`  ✅ "Aire acondicionado apagado" ya existe y está activo. Sin cambios.`)
        return
    }

    // Guardar
    tasks[idx53] = { ...t53, fotosRequeridas: JSON.stringify(fotos) }
    await prisma.configuracion.update({
        where: { clave },
        data: { valor: tasks }
    })

    console.log(`  💾 Guardado en BD correctamente`)
    console.log(`  📸 Fotos finales en Bloque 5.3:`)
    fotos.forEach(f => console.log(`     - ${f.tipo} | activa: ${f.activa} | desc: ${f.descripcion}`))
}

async function main() {
    console.log('🚀 Iniciando fix: Aire acondicionado apagado en Bloque 5.3')
    await fixTurno('cierre_tasks_tarde')
    await fixTurno('cierre_tasks_noche')
    console.log('\n✅ Script completado')
    console.log('🔄 El próximo cierre de turno tarde mostrará la foto del aire acondicionado')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
