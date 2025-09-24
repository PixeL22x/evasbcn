import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// Actualizar una tarea
export async function PUT(request) {
  try {
    const { tareaId, completada, cierreId } = await request.json()

    if (!tareaId) {
      return NextResponse.json(
        { error: 'ID de tarea es requerido' },
        { status: 400 }
      )
    }

    // Actualizar la tarea
    const tarea = await prisma.tarea.update({
      where: { id: tareaId },
      data: { completada },
    })

    // Si se completó la tarea, verificar si todas las tareas del cierre están completadas
    if (completada && cierreId) {
      const cierre = await prisma.cierre.findUnique({
        where: { id: cierreId },
        include: { tareas: true },
      })

      if (cierre) {
        const todasCompletadas = cierre.tareas.every(t => t.completada)
        
        if (todasCompletadas) {
          // Marcar el cierre como completado y establecer fecha de fin
          await prisma.cierre.update({
            where: { id: cierreId },
            data: {
              completado: true,
              fechaFin: new Date(),
            },
          })
        }
      }
    }

    return NextResponse.json({ tarea })
  } catch (error) {
    console.error('Error al actualizar tarea:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
