import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Obtener un cierre específico por ID
// Obtener un cierre específico por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cierre es requerido' },
        { status: 400 }
      )
    }

    const cierre = await prisma.cierre.findUnique({
      where: { id },
      include: {
        tareas: true,
      },
    })

    if (!cierre) {
      return NextResponse.json(
        { error: 'Cierre no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ cierre })
  } catch (error) {
    console.error('Error al obtener cierre:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Actualizar un cierre específico por ID
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const { totalVentas, fechaFin, ticketData, completado } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cierre es requerido' },
        { status: 400 }
      )
    }

    // Construir objeto de datos a actualizar
    const updateData = {}

    if (totalVentas !== undefined && totalVentas !== null) {
      updateData.totalVentas = parseFloat(totalVentas)
    }

    if (fechaFin !== undefined && fechaFin !== null) {
      // Si viene como string, convertir a Date
      updateData.fechaFin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin)
    }

    if (ticketData !== undefined && ticketData !== null) {
      // Guardar datos del ticket (items, imageUrl, etc.)
      updateData.ticketData = ticketData
    }

    // ⭐ NUEVO: Soportar actualización de completado
    if (completado !== undefined && completado !== null) {
      updateData.completado = completado
      console.log(`📝 Marcando cierre ${id} como ${completado ? 'completado' : 'pendiente'}`)
    }

    // Si no hay datos para actualizar, retornar error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron datos para actualizar' },
        { status: 400 }
      )
    }

    const cierre = await prisma.cierre.update({
      where: { id },
      data: updateData,
      include: {
        tareas: {
          orderBy: {
            createdAt: 'asc'
          }
        },
      },
    })

    return NextResponse.json({ cierre })
  } catch (error) {
    console.error('Error al actualizar cierre:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
