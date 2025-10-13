import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: create or overwrite an exception for a given date
// body: { trabajadorId: string, fecha: 'YYYY-MM-DD', turno: 'M'|'T'|'L', motivo?: string }
export async function POST(request) {
  try {
    const { trabajadorId, fecha, turno, motivo } = await request.json()
    if (!trabajadorId || !fecha || !turno) {
      return NextResponse.json({ error: 'trabajadorId, fecha y turno son requeridos' }, { status: 400 })
    }
    const validTurnos = new Set(['M', 'T', 'L'])
    if (!validTurnos.has(turno)) {
      return NextResponse.json({ error: 'Turno inválido' }, { status: 400 })
    }

    const date = new Date(`${fecha}T00:00:00.000Z`)

    // Upsert-like: delete existing exception for that date then create
    await prisma.excepcionHorario.deleteMany({ where: { trabajadorId, fecha: date } })
    const created = await prisma.excepcionHorario.create({
      data: { trabajadorId, fecha: date, turno, motivo: motivo || null },
    })

    return NextResponse.json({ success: true, excepcion: created })
  } catch (error) {
    console.error('Error POST /api/horarios/excepciones', error)
    return NextResponse.json({ error: 'Error al crear excepción' }, { status: 500 })
  }
}










