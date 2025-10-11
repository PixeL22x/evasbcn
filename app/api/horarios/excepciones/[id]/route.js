import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request, { params }) {
  try {
    const { id } = params
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await prisma.excepcionHorario.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error DELETE /api/horarios/excepciones/[id]', error)
    return NextResponse.json({ error: 'Error al eliminar excepción' }, { status: 500 })
  }
}









