import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total de cierres este mes
    const totalCierres = await prisma.cierre.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Total de trabajadores activos
    const totalTrabajadores = await prisma.trabajador.count({
      where: {
        activo: true
      }
    })

    // Ventas de hoy (suma de totalVentas de cierres completados hoy)
    const ventasHoyResult = await prisma.cierre.aggregate({
      _sum: {
        totalVentas: true
      },
      where: {
        completado: true,
        fechaFin: {
          gte: startOfDay
        },
        totalVentas: {
          not: null
        }
      }
    })

    // Tiempo promedio de cierre (últimos 30 días)
    const cierresCompletados = await prisma.cierre.findMany({
      where: {
        completado: true,
        fechaFin: {
          not: null
        },
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
        }
      },
      select: {
        fechaInicio: true,
        fechaFin: true
      }
    })

    let tiempoPromedioCierre = 0
    if (cierresCompletados.length > 0) {
      const tiemposCierre = cierresCompletados.map(cierre => {
        const inicio = new Date(cierre.fechaInicio)
        const fin = new Date(cierre.fechaFin)
        return (fin.getTime() - inicio.getTime()) / (1000 * 60) // en minutos
      })
      
      const tiempoTotal = tiemposCierre.reduce((sum, tiempo) => sum + tiempo, 0)
      tiempoPromedioCierre = Math.round(tiempoTotal / tiemposCierre.length)
    }

    return NextResponse.json({
      totalCierres,
      totalTrabajadores,
      ventasHoy: ventasHoyResult._sum.totalVentas || 0,
      tiempoPromedioCierre
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
