import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trabajador = searchParams.get('trabajador')

    if (!trabajador) {
      return NextResponse.json({ error: 'Trabajador requerido' }, { status: 400 })
    }

    console.log(`🌅 Buscando aperturas pendientes para: ${trabajador}`)

    // Buscar apertura más reciente no completada del trabajador (últimas 24 horas)
    const apertura = await prisma.cierre.findFirst({
      where: {
        trabajador: trabajador,
        tipo: 'apertura',
        completado: false,
        fechaInicio: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        tareas: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { fechaInicio: 'desc' }
    })

    if (apertura) {
      const tareasCompletadas = apertura.tareas.filter(t => t.completada).length
      const totalTareas = apertura.tareas.length
      console.log(`✅ Apertura pendiente encontrada: ${apertura.id} (${tareasCompletadas}/${totalTareas} tareas)`)
    } else {
      console.log('ℹ️ No hay aperturas pendientes')
    }

    return NextResponse.json({ cierre: apertura })
  } catch (error) {
    console.error('❌ Error al buscar apertura pendiente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
