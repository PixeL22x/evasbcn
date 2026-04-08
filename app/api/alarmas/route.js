import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/alarmas — listar todas las alarmas (admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const soloActivas = searchParams.get('activa') === 'true'

    const where = soloActivas ? { activa: true } : {}

    const alarmas = await prisma.alarmaTimer.findMany({
      where,
      include: {
        disparos: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
      },
      orderBy: { hora: 'asc' },
    })

    return NextResponse.json({ alarmas })
  } catch (error) {
    console.error('Error al obtener alarmas:', error)
    return NextResponse.json({ error: 'Error al obtener alarmas' }, { status: 500 })
  }
}

// POST /api/alarmas — crear una nueva alarma (admin)
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      titulo,
      descripcion,
      hora,
      recurrencia = 'diaria',
      fechaUnica,
      sonido = 'beep',
      color = 'naranja',
      creadaPor = 'Admin',
    } = body

    if (!titulo || !hora) {
      return NextResponse.json(
        { error: 'Título y hora son obligatorios' },
        { status: 400 }
      )
    }

    // Validar formato hora HH:mm
    const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/
    if (!horaRegex.test(hora)) {
      return NextResponse.json(
        { error: 'Formato de hora inválido. Use HH:mm (ej: 21:30)' },
        { status: 400 }
      )
    }

    const alarma = await prisma.alarmaTimer.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        hora,
        recurrencia,
        fechaUnica: fechaUnica ? new Date(fechaUnica) : null,
        sonido,
        color,
        creadaPor,
      },
    })

    return NextResponse.json({ alarma }, { status: 201 })
  } catch (error) {
    console.error('Error al crear alarma:', error)
    return NextResponse.json({ error: 'Error al crear alarma' }, { status: 500 })
  }
}
