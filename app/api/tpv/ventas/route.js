import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateTPVApiKey } from '@/lib/tpv-auth'

// GET — Lista ventas (público para historial del TPV y panel admin)
// Query params: ?hoy=true  → solo ventas de hoy
//               ?limit=20  → limitar resultados
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const soloHoy = searchParams.get('hoy') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = { anulada: false }

    if (soloHoy) {
      // Inicio del día de hoy en UTC (MongoDB guarda en UTC)
      const hoy = new Date()
      hoy.setUTCHours(0, 0, 0, 0)
      where.createdAt = { gte: hoy }
    }

    const ventas = await prisma.ventaTPV.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
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

    return NextResponse.json({ ventas })
  } catch (error) {
    console.error('[TPV] Error fetching ventas:', error)
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
}

// POST — Registrar una nueva venta desde el TPV
// Requiere header: x-api-key: <TPV_API_KEY>
// Body: { lineas: [{ productoId, nombreProducto, precio, cantidad, subtotal }] }
export async function POST(request) {
  // Validar API key
  if (!validateTPVApiKey(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { lineas, observaciones } = await request.json()

    if (!lineas || !Array.isArray(lineas) || lineas.length === 0) {
      return NextResponse.json({ error: 'Se requieren líneas de venta' }, { status: 400 })
    }

    // Validar cada línea
    for (const linea of lineas) {
      if (!linea.nombreProducto || !linea.precio || !linea.cantidad || !linea.subtotal) {
        return NextResponse.json(
          { error: 'Cada línea debe tener nombreProducto, precio, cantidad y subtotal' },
          { status: 400 }
        )
      }
    }

    // Calcular total desde las líneas (no confiar en el cliente)
    const total = lineas.reduce((sum, l) => sum + parseFloat(l.subtotal), 0)
    const totalRedondeado = Math.round(total * 100) / 100

    // Crear la venta con sus líneas en una sola operación
    const venta = await prisma.ventaTPV.create({
      data: {
        total: totalRedondeado,
        observaciones: observaciones || null,
        lineas: {
          create: lineas.map((l) => ({
            productoId: l.productoId || null,
            nombreProducto: l.nombreProducto,
            precio: parseFloat(l.precio),
            cantidad: parseInt(l.cantidad),
            subtotal: parseFloat(l.subtotal),
          })),
        },
      },
      include: {
        lineas: true,
      },
    })

    console.log(`[TPV] Venta registrada: ${venta.id} — €${venta.total}`)
    return NextResponse.json({ venta }, { status: 201 })
  } catch (error) {
    console.error('[TPV] Error creating venta:', error)
    return NextResponse.json({ error: 'Error al registrar la venta' }, { status: 500 })
  }
}
