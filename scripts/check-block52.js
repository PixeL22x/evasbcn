// Script para verificar configuración del Bloque 5.2
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBlock52() {
    try {
        const config = await prisma.configuracion.findUnique({
            where: { clave: 'cierre_tasks_tarde' }
        })

        if (!config || !config.valor) {
            console.log('❌ No se encontró configuración')
            return
        }

        const task52 = config.valor.find(t =>
            t.nombre && t.nombre.includes('5.2')
        )

        if (!task52) {
            console.log('❌ No se encontró Bloque 5.2')
            return
        }

        console.log('📋 Bloque 5.2 actual en BD:')
        console.log(JSON.stringify(task52, null, 2))

        console.log('\n🔍 Campos clave:')
        console.log('- nombre:', task52.nombre)
        console.log('- requiereInput:', task52.requiereInput)
        console.log('- inputType:', task52.inputType)
        console.log('- requiereEscaneo:', task52.requiereEscaneo)
        console.log('- duracion:', task52.duracion)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkBlock52()
