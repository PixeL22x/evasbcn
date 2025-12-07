import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - Obtener reseñas con paginación
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trabajadorId = searchParams.get('trabajadorId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const calificacion = searchParams.get('calificacion')
    const limit = parseInt(searchParams.get('limit')) || 5
    const skip = parseInt(searchParams.get('skip')) || 0

    let whereClause = {}

    if (trabajadorId) {
      whereClause.trabajadorId = trabajadorId
    }

    if (calificacion && calificacion !== 'todos') {
      whereClause.calificacion = parseInt(calificacion)
    }

    if (fechaDesde || fechaHasta) {
      whereClause.fechaResena = {}
      if (fechaDesde) {
        const desde = new Date(fechaDesde)
        desde.setHours(0, 0, 0, 0)
        whereClause.fechaResena.gte = desde
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        whereClause.fechaResena.lte = hasta
      }
    }

    // Obtener reseñas con paginación
    const [resenas, total] = await Promise.all([
      prisma.resena.findMany({
        where: whereClause,
        include: {
          trabajador: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          fechaResena: 'desc'
        },
        take: limit,
        skip: skip
      }),
      prisma.resena.count({
        where: whereClause
      })
    ])

    return NextResponse.json({ 
      success: true,
      resenas,
      total,
      hasMore: skip + limit < total
    })
  } catch (error) {
    console.error('Error al obtener reseñas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva reseña
export async function POST(request) {
  try {
    const body = await request.json()
    const { trabajadorId, calificacion, fechaResena } = body

    // Validaciones
    if (!trabajadorId || !calificacion || !fechaResena) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Validar calificación (1-5)
    if (calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5 estrellas' },
        { status: 400 }
      )
    }

    // Validar que el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId }
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      )
    }

    // Crear la reseña (solo fecha, sin hora)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // Establecer hora a 00:00:00
    
    const resena = await prisma.resena.create({
      data: {
        trabajadorId,
        calificacion: parseInt(calificacion),
        fechaResena: new Date(fechaResena),
        fechaRegistro: hoy
      },
      include: {
        trabajador: {
          select: {
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      resena,
      message: 'Reseña registrada exitosamente'
    })
  } catch (error) {
    console.error('Error al crear reseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

