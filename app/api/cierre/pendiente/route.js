import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const trabajador = searchParams.get('trabajador')

        if (!trabajador) {
            return NextResponse.json({ error: 'Trabajador requerido' }, { status: 400 })
        }

        console.log(`🔍 Buscando cierres pendientes para: ${trabajador}`)

        // Buscar cierre más reciente no completado del trabajador (últimas 24 horas)
        const cierre = await prisma.cierre.findFirst({
            where: {
                trabajador: trabajador,
                tipo: 'cierre',
                completado: false,
                fechaInicio: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            include: {
                tareas: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: {
                fechaInicio: 'desc'
            }
        })

        if (cierre) {
            const tareasCompletadas = cierre.tareas.filter(t => t.completada).length
            const totalTareas = cierre.tareas.length
            console.log(`✅ Cierre pendiente encontrado: ${cierre.id} (${tareasCompletadas}/${totalTareas} tareas)`)
        } else {
            console.log('ℹ️ No hay cierres pendientes')
        }

        return NextResponse.json({ cierre })
    } catch (error) {
        console.error('❌ Error al buscar cierre pendiente:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
