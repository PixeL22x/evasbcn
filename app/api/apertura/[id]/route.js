import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Obtener una apertura específica por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID de apertura es requerido' }, { status: 400 })
    }

    const apertura = await prisma.cierre.findUnique({
      where: { id },
      include: { tareas: true },
    })

    if (!apertura || apertura.tipo !== 'apertura') {
      return NextResponse.json({ error: 'Apertura no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ cierre: apertura })
  } catch (error) {
    console.error('Error al obtener apertura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Actualizar una apertura específica por ID
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { fechaFin, completado } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de apertura es requerido' }, { status: 400 })
    }

    const updateData = {}

    if (fechaFin !== undefined && fechaFin !== null) {
      updateData.fechaFin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin)
    }

    if (completado !== undefined && completado !== null) {
      updateData.completado = completado
      console.log(`📝 Marcando apertura ${id} como ${completado ? 'completada' : 'pendiente'}`)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron datos para actualizar' }, { status: 400 })
    }

    const apertura = await prisma.cierre.update({
      where: { id },
      data: updateData,
      include: {
        tareas: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ cierre: apertura })
  } catch (error) {
    console.error('Error al actualizar apertura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Eliminar apertura
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.tarea.deleteMany({ where: { cierreId: id } })
    await prisma.cierre.delete({ where: { id } })

    console.log(`🗑️ Apertura ${id} eliminada`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Apertura no encontrada' }, { status: 404 })
    }
    console.error('Error al eliminar apertura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
