import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener conteo de solicitudes pendientes
export async function GET() {
  try {
    const pendientesCount = await prisma.solicitudCambioTurno.count({
      where: {
        estado: 'pendiente'
      }
    })

    return NextResponse.json({ count: pendientesCount })
  } catch (error) {
    console.error('Error fetching solicitudes count:', error)
    return NextResponse.json(
      { error: 'Error al obtener el conteo de solicitudes' },
      { status: 500 }
    )
  }
}











