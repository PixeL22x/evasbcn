import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// DELETE - Eliminar trabajador
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID del trabajador es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id }
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar trabajador
    await prisma.trabajador.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Trabajador eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar trabajador:', error)
    return NextResponse.json(
      { error: 'Error al eliminar trabajador' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar trabajador
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { nombre, password, activo } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID del trabajador es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id }
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para actualizar
    const updateData = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (password !== undefined && password !== '') updateData.password = password
    if (activo !== undefined) updateData.activo = activo

    // Actualizar trabajador
    const trabajadorActualizado = await prisma.trabajador.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Trabajador actualizado exitosamente',
      trabajador: {
        id: trabajadorActualizado.id,
        nombre: trabajadorActualizado.nombre,
        activo: trabajadorActualizado.activo,
        createdAt: trabajadorActualizado.createdAt
      }
    })

  } catch (error) {
    console.error('Error al actualizar trabajador:', error)
    return NextResponse.json(
      { error: 'Error al actualizar trabajador' },
      { status: 500 }
    )
  }
}

