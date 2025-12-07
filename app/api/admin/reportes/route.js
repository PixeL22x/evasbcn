import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '7d'
    
    // Calcular fechas según el rango
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Obtener cierres en el rango de fechas
    const cierres = await prisma.cierre.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        tareas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular métricas
    const totalCierres = cierres.length
    const cierresCompletados = cierres.filter(c => c.completado)
    
    // Solo considerar cierres de tarde para ventas promedio
    const cierresTardeCompletados = cierresCompletados.filter(c => c.turno === "tarde")
    const ventasPromedio = cierresTardeCompletados.length > 0 
      ? cierresTardeCompletados.reduce((sum, c) => sum + (c.totalVentas || 0), 0) / cierresTardeCompletados.length
      : 0

    // Calcular tiempo promedio (simulado)
    const tiempoPromedio = cierresCompletados.length > 0 ? 35 : 0

    // Calcular eficiencia
    const totalTareas = cierres.reduce((sum, c) => sum + c.tareas.length, 0)
    const tareasCompletadas = cierres.reduce((sum, c) => sum + c.tareas.filter(t => t.completada).length, 0)
    const eficiencia = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0

    // Estadísticas por trabajador
    const trabajadorStats = {}
    cierresCompletados.forEach(cierre => {
      if (!trabajadorStats[cierre.trabajador]) {
        trabajadorStats[cierre.trabajador] = {
          nombre: cierre.trabajador,
          cierresCompletados: 0,
          ventasTotal: 0
        }
      }
      trabajadorStats[cierre.trabajador].cierresCompletados++
      // Solo sumar ventas de cierres de tarde para evitar duplicación
      if (cierre.turno === "tarde") {
        trabajadorStats[cierre.trabajador].ventasTotal += cierre.totalVentas || 0
      }
    })

    const trabajadorStatsArray = Object.values(trabajadorStats).map(stats => ({
      ...stats,
      ventasPromedio: stats.cierresCompletados > 0 ? stats.ventasTotal / stats.cierresCompletados : 0
    }))

    // Cierres por día
    const cierresPorDia = {}
    cierres.forEach(cierre => {
      const fecha = cierre.createdAt.toISOString().split('T')[0]
      cierresPorDia[fecha] = (cierresPorDia[fecha] || 0) + 1
    })

    const cierresPorDiaArray = Object.entries(cierresPorDia).map(([fecha, cierres]) => ({
      fecha,
      cierres
    })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    const reportData = {
      totalCierres,
      ventasPromedio,
      tiempoPromedio,
      eficiencia,
      trabajadorStats: trabajadorStatsArray,
      cierresPorDia: cierresPorDiaArray
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error al generar reporte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
