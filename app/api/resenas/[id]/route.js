import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// DELETE - Eliminar reseña
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la reseña es requerido' },
        { status: 400 }
      )
    }

    // Verificar si la reseña existe
    const resena = await prisma.resena.findUnique({
      where: { id }
    })

    if (!resena) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar reseña
    await prisma.resena.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar reseña:', error)
    return NextResponse.json(
      { error: 'Error al eliminar reseña' },
      { status: 500 }
    )
  }
}

