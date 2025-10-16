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
          const cierreActualizado = await prisma.cierre.update({
            where: { id: cierreId },
            data: {
              completado: true,
              fechaFin: new Date(),
            },
            include: {
              tareas: {
                where: { requiereFotos: true },
                include: { fotos: true }
              }
            }
          })

          // Enviar notificación a Telegram
          try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/telegram/notify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cierreId: cierreActualizado.id,
                trabajador: cierreActualizado.trabajador,
                turno: cierreActualizado.turno,
                totalVentas: cierreActualizado.totalVentas,
                fechaFin: cierreActualizado.fechaFin
              })
            })
            console.log('✅ Notificación de cierre enviada a Telegram')
          } catch (telegramError) {
            console.error('⚠️ Error enviando notificación a Telegram:', telegramError)
            // No fallar la operación principal por un error de Telegram
          }
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
