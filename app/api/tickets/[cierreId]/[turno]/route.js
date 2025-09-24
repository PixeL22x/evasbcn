import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request, { params }) {
  try {
    const { cierreId, turno } = params

    const fotos = await prisma.ticketFoto.findMany({
      where: {
        cierreId,
        turno
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      fotos
    })

  } catch (error) {
    console.error('Error al obtener fotos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { cierreId, turno } = params

    // Eliminar todas las fotos del turno específico
    await prisma.ticketFoto.deleteMany({
      where: {
        cierreId,
        turno
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Fotos eliminadas correctamente'
    })

  } catch (error) {
    console.error('Error al eliminar fotos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
