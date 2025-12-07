import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: set weekly rules for a worker
// body: { trabajadorId: string, reglas: Array<{ diaSemana: number, turno: 'M'|'T'|'L' }> }
export async function POST(request) {
  try {
    const { trabajadorId, reglas } = await request.json()
    if (!trabajadorId || !Array.isArray(reglas)) {
      return NextResponse.json({ error: 'trabajadorId y reglas son requeridos' }, { status: 400 })
    }

    // Clean previous rules
    await prisma.reglaHorario.deleteMany({ where: { trabajadorId } })

    const validTurnos = new Set(['M', 'T', 'L'])
    const data = reglas
      .filter((r) => r && Number.isInteger(r.diaSemana) && r.diaSemana >= 0 && r.diaSemana <= 6 && validTurnos.has(r.turno))
      .map((r) => ({ trabajadorId, diaSemana: r.diaSemana, turno: r.turno }))

    if (data.length === 0) {
      return NextResponse.json({ error: 'No hay reglas válidas' }, { status: 400 })
    }

    await prisma.reglaHorario.createMany({ data })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error POST /api/horarios/reglas', error)
    return NextResponse.json({ error: 'Error al guardar reglas' }, { status: 500 })
  }
}













