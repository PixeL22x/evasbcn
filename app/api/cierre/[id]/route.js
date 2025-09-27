import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Obtener un cierre específico por ID
export async function GET(request, { params }) {
  try {
    const { id } = params

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
    const { id } = params
    const { totalVentas } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cierre es requerido' },
        { status: 400 }
      )
    }

    if (totalVentas === undefined || totalVentas === null) {
      return NextResponse.json(
        { error: 'Total de ventas es requerido' },
        { status: 400 }
      )
    }

    const cierre = await prisma.cierre.update({
      where: { id },
      data: { totalVentas: parseFloat(totalVentas) },
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
