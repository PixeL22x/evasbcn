import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT — Editar un producto del catálogo TPV
export async function PUT(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const { nombre, categoria, precio, descripcion, emoji, imageUrl, orden, activo } = await request.json()

    const updateData = {}
    if (nombre !== undefined) updateData.nombre = nombre.trim()
    if (categoria !== undefined) updateData.categoria = categoria
    if (precio !== undefined) updateData.precio = parseFloat(precio)
    if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null
    if (emoji !== undefined) updateData.emoji = emoji?.trim() || null
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null
    if (orden !== undefined) updateData.orden = parseInt(orden)
    if (activo !== undefined) updateData.activo = Boolean(activo)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 })
    }

    const producto = await prisma.productoTPV.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(producto)
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    console.error('[TPV] Error updating producto:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

// DELETE — Desactivar un producto (soft delete: activo = false)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.productoTPV.update({
      where: { id },
      data: { activo: false },
    })

    return NextResponse.json({ ok: true, message: 'Producto desactivado' })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    console.error('[TPV] Error deleting producto:', error)
    return NextResponse.json({ error: 'Error al desactivar producto' }, { status: 500 })
  }
}
