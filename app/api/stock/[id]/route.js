import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener producto específico
export async function GET(request, { params }) {
  try {
    const { id } = params

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 20,
          include: {
            trabajador: {
              select: { nombre: true }
            }
          }
        }
      }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error fetching producto:', error)
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}

// PUT - Actualizar producto
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { nombre, categoria, stockMinimo, precio, activo } = await request.json()

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        categoria,
        stockMinimo,
        precio,
        activo
      }
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error updating producto:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

// DELETE - Desactivar producto (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const producto = await prisma.producto.update({
      where: { id },
      data: { activo: false }
    })

    return NextResponse.json({ message: 'Producto desactivado correctamente' })
  } catch (error) {
    console.error('Error deactivating producto:', error)
    return NextResponse.json({ error: 'Error al desactivar producto' }, { status: 500 })
  }
}





