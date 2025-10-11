import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT - Actualizar estado de solicitud (aprobar/rechazar)
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { estado, observacionesAdmin } = body

    // Validar estado
    if (!['aprobada', 'rechazada'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    // Buscar la solicitud
    const solicitud = await prisma.solicitudCambioTurno.findUnique({
      where: { id }
    })

    if (!solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    if (solicitud.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'La solicitud ya fue procesada' },
        { status: 400 }
      )
    }

    // Actualizar la solicitud
    await prisma.solicitudCambioTurno.update({
      where: { id },
      data: {
        estado,
        fechaRespuesta: new Date(),
        observacionesAdmin
      }
    })

    // Obtener la solicitud actualizada
    const solicitudActualizada = await prisma.solicitudCambioTurno.findUnique({
      where: { id }
    })

    return NextResponse.json(solicitudActualizada)
  } catch (error) {
    console.error('Error updating solicitud:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la solicitud' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar solicitud (solo si está pendiente)
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const solicitud = await prisma.solicitudCambioTurno.findUnique({
      where: { id }
    })

    if (!solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }


    await prisma.solicitudCambioTurno.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Solicitud eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting solicitud:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la solicitud' },
      { status: 500 }
    )
  }
}
