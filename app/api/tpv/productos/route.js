import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Lista todos los productos activos del catálogo TPV
// Público: no requiere autenticación (el TPV necesita este endpoint sin auth)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = includeInactive ? {} : { activo: true }

    const productos = await prisma.productoTPV.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { orden: 'asc' },
        { nombre: 'asc' },
      ],
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('[TPV] Error fetching productos:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST — Crear nuevo producto en el catálogo TPV (solo desde el panel admin)
// No se exige API key aquí porque se accede desde el panel admin autenticado con cookie
export async function POST(request) {
  try {
    const { nombre, categoria, precio, descripcion, emoji, orden } = await request.json()

    if (!nombre || !categoria || precio === undefined || precio === null) {
      return NextResponse.json(
        { error: 'nombre, categoria y precio son requeridos' },
        { status: 400 }
      )
    }

    if (isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número positivo' },
        { status: 400 }
      )
    }

    const producto = await prisma.productoTPV.create({
      data: {
        nombre: nombre.trim(),
        categoria,
        precio: parseFloat(precio),
        descripcion: descripcion?.trim() || null,
        emoji: emoji?.trim() || null,
        orden: orden ?? 0,
      },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('[TPV] Error creating producto:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
