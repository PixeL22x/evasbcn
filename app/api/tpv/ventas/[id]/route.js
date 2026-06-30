import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE — Anular una venta (soft delete: anulada = true)
// Solo desde el panel admin (no requiere API key, requiere sesión cookie de admin)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const venta = await prisma.ventaTPV.findUnique({ where: { id } })

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    if (venta.anulada) {
      return NextResponse.json({ error: 'Esta venta ya está anulada' }, { status: 400 })
    }

    const ventaAnulada = await prisma.ventaTPV.update({
      where: { id },
      data: { anulada: true },
    })

    console.log(`[TPV] Venta anulada: ${id} — €${ventaAnulada.total}`)
    return NextResponse.json({ ok: true, venta: ventaAnulada })
  } catch (error) {
    console.error('[TPV] Error anulando venta:', error)
    return NextResponse.json({ error: 'Error al anular la venta' }, { status: 500 })
  }
}

// GET — Obtener detalle de una venta concreta
export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const venta = await prisma.ventaTPV.findUnique({
      where: { id },
      include: {
        lineas: {
          include: {
            producto: {
              select: { nombre: true, emoji: true, categoria: true },
            },
          },
        },
      },
    })

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ venta })
  } catch (error) {
    console.error('[TPV] Error fetching venta:', error)
    return NextResponse.json({ error: 'Error al obtener la venta' }, { status: 500 })
  }
}
