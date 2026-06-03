import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Devuelve la lista de nombres de trabajadores únicos que tienen al menos un cierre
export async function GET() {
  try {
    const result = await prisma.cierre.findMany({
      select: { trabajador: true },
      distinct: ['trabajador'],
      orderBy: { trabajador: 'asc' },
    })

    const trabajadores = result.map((r) => r.trabajador)

    return NextResponse.json({ trabajadores })
  } catch (error) {
    console.error('Error fetching trabajadores:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
