import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// PUT - Actualizar estado del pedido
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { estado, observaciones } = await request.json()

    if (!estado) {
      return NextResponse.json(
        { error: 'Estado es requerido' },
        { status: 400 }
      )
    }

    const estadosValidos = ['pendiente', 'procesado', 'entregado']
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    const updateData = {
      estado,
      observaciones: observaciones || null
    }

    // Si se marca como procesado, actualizar fecha
    if (estado === 'procesado') {
      updateData.fechaProcesado = new Date()
    }

    const pedido = await prisma.pedidoHelado.update({
      where: { id },
      data: updateData,
      include: {
        trabajador: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      pedido
    })

  } catch (error) {
    console.error('Error al actualizar pedido:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar pedido
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.pedidoHelado.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar pedido:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    )
  }
}

