import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '30d'
    
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
        startDate.setDate(now.getDate() - 30)
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

    const cierresCompletados = cierres.filter(c => c.completado)
    
    // Calcular KPIs
    const ventasPromedio = cierresCompletados.length > 0 
      ? cierresCompletados.reduce((sum, c) => sum + (c.totalVentas || 0), 0) / cierresCompletados.length
      : 0

    const tiempoPromedio = 35 // Simulado
    const eficienciaPromedio = cierres.length > 0 
      ? Math.round((cierresCompletados.length / cierres.length) * 100)
      : 0

    // Calcular crecimiento de ventas (simulado)
    const crecimientoVentas = Math.random() * 20 - 5 // Entre -5% y 15%

    // Ventas por hora del día (datos simulados)
    const ventasPorHora = Array.from({ length: 24 }, (_, i) => ({
      hora: `${i.toString().padStart(2, '0')}:00`,
      ventas: Math.random() * 500 + 100
    }))

    // Rendimiento por trabajador
    const trabajadorStats = {}
    cierresCompletados.forEach(cierre => {
      if (!trabajadorStats[cierre.trabajador]) {
        trabajadorStats[cierre.trabajador] = {
          trabajador: cierre.trabajador,
          cierresCompletados: 0
        }
      }
      trabajadorStats[cierre.trabajador].cierresCompletados++
    })

    const rendimientoPorTrabajador = Object.values(trabajadorStats)

    // Tiempos por tarea (datos simulados basados en tareas reales)
    const tareasUnicas = await prisma.tarea.findMany({
      select: {
        nombre: true
      },
      distinct: ['nombre']
    })

    const tiemposPorTarea = tareasUnicas.map(tarea => ({
      nombreTarea: tarea.nombre.substring(0, 30) + (tarea.nombre.length > 30 ? '...' : ''),
      tiempoPromedio: Math.floor(Math.random() * 10) + 2 // Entre 2 y 12 minutos
    }))

    // Tendencias semanales (datos simulados)
    const semanas = Array.from({ length: 4 }, (_, i) => {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - (i * 7))
      return `Semana ${4-i}`
    })
    
    const tendenciasSemanales = semanas.map(semana => ({
      semana,
      cierres: Math.floor(Math.random() * 10) + 5
    }))

    const analyticsData = {
      kpis: {
        ventasPromedio,
        tiempoPromedio,
        eficienciaPromedio,
        crecimientoVentas: Math.round(crecimientoVentas * 10) / 10
      },
      ventasPorHora,
      rendimientoPorTrabajador,
      tiemposPorTarea,
      tendenciasSemanales
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error al generar analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
