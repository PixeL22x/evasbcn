import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Estadísticas del TPV del día actual
// Público: usado por el botón "Importar desde TPV" en el flujo de cierre del trabajador
// y por el panel admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get('fecha') // opcional: YYYY-MM-DD

    let inicioDia, finDia

    if (fechaParam) {
      // Fecha específica solicitada
      const partes = fechaParam.split('-')
      inicioDia = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 0, 0, 0, 0))
      finDia = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 23, 59, 59, 999))
    } else {
      // Hoy
      const ahora = new Date()
      inicioDia = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 0, 0, 0, 0))
      finDia = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 23, 59, 59, 999))
    }

    // Obtener todas las ventas no anuladas del día
    const ventas = await prisma.ventaTPV.findMany({
      where: {
        anulada: false,
        createdAt: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      include: {
        lineas: true,
      },
    })

    // Calcular totales
    const numVentas = ventas.length
    const totalHoy = ventas.reduce((sum, v) => sum + v.total, 0)
    const totalRedondeado = Math.round(totalHoy * 100) / 100
    const ticketMedio = numVentas > 0 ? Math.round((totalHoy / numVentas) * 100) / 100 : 0

    // Top producto del día (por unidades vendidas)
    const contadorProductos = {}
    ventas.forEach((venta) => {
      venta.lineas.forEach((linea) => {
        const nombre = linea.nombreProducto
        if (!contadorProductos[nombre]) {
          contadorProductos[nombre] = { nombre, cantidad: 0, importe: 0 }
        }
        contadorProductos[nombre].cantidad += linea.cantidad
        contadorProductos[nombre].importe += linea.subtotal
      })
    })

    const topProductos = Object.values(contadorProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)

    return NextResponse.json({
      totalHoy: totalRedondeado,
      numVentas,
      ticketMedio,
      topProductos,
      fecha: inicioDia.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('[TPV] Error fetching stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
