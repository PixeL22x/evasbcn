import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT /api/alarmas/[id] — actualizar una alarma
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      titulo,
      descripcion,
      hora,
      recurrencia,
      fechaUnica,
      activa,
      sonido,
      color,
    } = body

    // Validar formato hora si se proporciona
    if (hora) {
      const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/
      if (!horaRegex.test(hora)) {
        return NextResponse.json(
          { error: 'Formato de hora inválido. Use HH:mm (ej: 21:30)' },
          { status: 400 }
        )
      }
    }

    const updateData = {}
    if (titulo !== undefined) updateData.titulo = titulo
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (hora !== undefined) updateData.hora = hora
    if (recurrencia !== undefined) updateData.recurrencia = recurrencia
    if (fechaUnica !== undefined) updateData.fechaUnica = fechaUnica ? new Date(fechaUnica) : null
    if (activa !== undefined) updateData.activa = activa
    if (sonido !== undefined) updateData.sonido = sonido
    if (color !== undefined) updateData.color = color

    const alarma = await prisma.alarmaTimer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ alarma })
  } catch (error) {
    console.error('Error al actualizar alarma:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Alarma no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al actualizar alarma' }, { status: 500 })
  }
}

// DELETE /api/alarmas/[id] — eliminar una alarma
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    await prisma.alarmaTimer.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Alarma eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar alarma:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Alarma no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al eliminar alarma' }, { status: 500 })
  }
}
