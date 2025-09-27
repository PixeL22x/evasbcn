import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - Obtener todos los pedidos de helados
export async function GET() {
  try {
    const pedidos = await prisma.pedidoHelado.findMany({
      include: {
        trabajador: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fechaPedido: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      pedidos
    })

  } catch (error) {
    console.error('Error al obtener pedidos de helados:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos de helados' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo pedido de helados
export async function POST(request) {
  try {
    const { trabajadorId, sabores, observaciones } = await request.json()

    if (!trabajadorId || !sabores) {
      return NextResponse.json(
        { error: 'Trabajador y sabores son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId }
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      )
    }

    // Crear el pedido
    const pedido = await prisma.pedidoHelado.create({
      data: {
        trabajadorId,
        sabores: JSON.stringify(sabores),
        observaciones: observaciones || null,
        estado: 'pendiente'
      },
      include: {
        trabajador: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido de helados creado exitosamente',
      pedido
    })

  } catch (error) {
    console.error('Error al crear pedido de helados:', error)
    return NextResponse.json(
      { error: 'Error al crear pedido de helados' },
      { status: 500 }
    )
  }
}

