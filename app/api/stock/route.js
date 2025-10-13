import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los productos con stock
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        movimientos: {
          take: 5,
          orderBy: { fecha: 'desc' },
          include: {
            trabajador: {
              select: { nombre: true }
            }
          }
        }
      }
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error fetching productos:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST - Crear nuevo producto
export async function POST(request) {
  try {
    const { nombre, categoria, stock, stockMinimo, precio } = await request.json()

    if (!nombre || !categoria) {
      return NextResponse.json({ error: 'Nombre y categoría son requeridos' }, { status: 400 })
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        categoria,
        stock: stock || 0,
        stockMinimo: stockMinimo || 5,
        precio: precio || null
      }
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error creating producto:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}





