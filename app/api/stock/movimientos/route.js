import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener movimientos de stock
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productoId = searchParams.get('productoId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const skip = (page - 1) * limit

    const where = productoId ? { productoId } : {}

    const [total, movimientos] = await prisma.$transaction([
      prisma.movimientoStock.count({ where }),
      prisma.movimientoStock.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
        include: {
          producto: {
            select: { nombre: true, categoria: true }
          },
          trabajador: {
            select: { nombre: true }
          }
        }
      })
    ])

    return NextResponse.json({
      data: movimientos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error) {
    console.error('Error fetching movimientos:', error)
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 })
  }
}

// POST - Registrar movimiento de stock
export async function POST(request) {
  try {
    const { productoId, tipo, cantidad, motivo, trabajadorId, observaciones } = await request.json()

    if (!productoId || !tipo || !cantidad || !motivo) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Calcular nuevo stock
    const cantidadAjuste = tipo === 'entrada' ? cantidad : -cantidad
    const nuevoStock = producto.stock + cantidadAjuste

    if (nuevoStock < 0) {
      return NextResponse.json({ error: 'No hay suficiente stock disponible' }, { status: 400 })
    }

    // Actualizar stock del producto
    await prisma.producto.update({
      where: { id: productoId },
      data: { stock: nuevoStock }
    })

    // Crear movimiento
    const movimiento = await prisma.movimientoStock.create({
      data: {
        productoId,
        tipo,
        cantidad,
        motivo,
        trabajadorId: trabajadorId || null,
        observaciones: observaciones || null
      },
      include: {
        producto: {
          select: { nombre: true, categoria: true }
        },
        trabajador: {
          select: { nombre: true }
        }
      }
    })

    return NextResponse.json(movimiento)
  } catch (error) {
    console.error('Error creating movimiento:', error)
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 })
  }
}








