import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '30d'

    let days = 30
    switch (range) {
      case '7d':
        days = 7
        break
      case '30d':
        days = 30
        break
      case '90d':
        days = 90
        break
    }

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Obtener datos de cierres por día
    const cierres = await prisma.cierre.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        totalVentas: true,
        completado: true
      }
    })

    // Agrupar por fecha
    const dataByDate = {}
    
    // Inicializar todas las fechas con 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dataByDate[dateStr] = {
        date: dateStr,
        ventas: 0,
        cierres: 0
      }
    }

    // Llenar con datos reales
    cierres.forEach(cierre => {
      const dateStr = cierre.createdAt.toISOString().split('T')[0]
      if (dataByDate[dateStr]) {
        dataByDate[dateStr].cierres += 1
        if (cierre.totalVentas && cierre.completado) {
          dataByDate[dateStr].ventas += cierre.totalVentas
        }
      }
    })

    const chartData = Object.values(dataByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json(chartData)

  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
