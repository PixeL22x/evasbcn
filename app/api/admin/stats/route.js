import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getBarcelonaTimeInfo } from '../../../../lib/utils'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Usar la misma lógica que getTrabajadorTurnoActual para obtener fecha de Barcelona
    const timeInfo = getBarcelonaTimeInfo()
    const { today } = timeInfo
    
    // Crear fecha de inicio del día usando la fecha de Barcelona
    // Usar una fecha específica para evitar problemas de zona horaria
    const startOfDay = new Date(today + 'T00:00:00.000Z')
    
    // Debug: mostrar información
    console.log('Stats Debug:', {
      today: today,
      startOfDay: startOfDay.toISOString(),
      currentTime: new Date().toISOString()
    })
    
    // Debug: verificar cierres del día 17
    const cierresHoy = await prisma.cierre.findMany({
      where: {
        fechaFin: {
          gte: startOfDay
        }
      },
      select: { fechaFin: true, turno: true, totalVentas: true, completado: true },
      orderBy: { fechaFin: 'desc' }
    })
    console.log('Cierres desde startOfDay:', cierresHoy)

    // Ventas del turno mañana (solo turno mañana para evitar duplicación)
    const ventasTurnoMananaResult = await prisma.cierre.aggregate({
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
        },
        turno: "mañana"  // Solo contar ventas del turno de mañana
      }
    })

    // Total de trabajadores activos
    const totalTrabajadores = await prisma.trabajador.count({
      where: {
        activo: true
      }
    })

    // Ventas de hoy (solo turno de noche para evitar duplicación)
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
        },
        turno: "tarde"  // Solo contar ventas del turno de tarde (total del día)
      }
    })

    // Trabajador de turno actual
    const trabajadorActual = await getTrabajadorTurnoActual()

    return NextResponse.json({
      ventasTurnoManana: ventasTurnoMananaResult._sum.totalVentas || 0,
      totalTrabajadores,
      ventasHoy: ventasHoyResult._sum.totalVentas || 0,
      trabajadorActual
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para obtener el trabajador de turno actual
async function getTrabajadorTurnoActual() {
  try {
    // Usar zona horaria de Barcelona
    const timeInfo = getBarcelonaTimeInfo()
    const { hour: currentHour, minute: currentMinute, timeInMinutes: currentTime, dayOfWeek, today, isWeekend } = timeInfo

    // Determinar turno actual basado en la hora
    let turnoActual = 'L' // Libre por defecto
    
    // Turno Mañana: 12:30 - 17:00 (753 - 1020 minutos)
    // Turno Mañana (fines de semana): 11:30 - 17:00 (690 - 1020 minutos)
    // Turno Tarde: 17:00 - 23:00 (1020 - 1380 minutos)
    const morningStart = isWeekend ? 690 : 753 // 11:30 o 12:30
    const morningEnd = 1020 // 17:00
    const eveningStart = 1020 // 17:00
    const eveningEnd = 1380 // 23:00

    if (currentTime >= morningStart && currentTime < morningEnd) {
      turnoActual = 'M' // Mañana
    } else if (currentTime >= eveningStart && currentTime < eveningEnd) {
      turnoActual = 'T' // Tarde
    }

    // Si no hay turno activo, retornar null
    if (turnoActual === 'L') {
      return null
    }

    // Buscar trabajadores activos
    const trabajadores = await prisma.trabajador.findMany({
      where: { activo: true },
      include: {
        reglasHorario: true,
        excepcionesHorario: {
          where: {
            fecha: {
              gte: new Date(today + 'T00:00:00.000+02:00'), // Barcelona timezone
              lt: new Date(today + 'T23:59:59.999+02:00')   // Barcelona timezone
            }
          }
        }
      }
    })

    // Buscar trabajador asignado para el turno actual
    for (const trabajador of trabajadores) {
      let turnoAsignado = null

      // Verificar excepciones primero (tienen prioridad)
      const excepcionHoy = trabajador.excepcionesHorario.find(exc => 
        exc.fecha.toISOString().split('T')[0] === today
      )
      
      if (excepcionHoy) {
        turnoAsignado = excepcionHoy.turno
      } else {
        // Usar regla semanal
        const reglaHoy = trabajador.reglasHorario.find(regla => regla.diaSemana === dayOfWeek)
        if (reglaHoy) {
          turnoAsignado = reglaHoy.turno
        }
      }

      // Si este trabajador está asignado al turno actual
      if (turnoAsignado === turnoActual) {
        return {
          nombre: trabajador.nombre,
          turno: turnoActual === 'M' ? 'Mañana' : 'Tarde',
          horaInicio: turnoActual === 'M' ? (isWeekend ? '11:30' : '12:30') : '17:00',
          horaFin: turnoActual === 'M' ? '17:00' : '23:00',
          minutosRestantes: turnoActual === 'M' 
            ? morningEnd - currentTime 
            : eveningEnd - currentTime
        }
      }
    }

    // Si no se encuentra trabajador asignado
    return {
      nombre: 'Sin asignar',
      turno: turnoActual === 'M' ? 'Mañana' : 'Tarde',
      horaInicio: turnoActual === 'M' ? (isWeekend ? '11:30' : '12:30') : '17:00',
      horaFin: turnoActual === 'M' ? '17:00' : '23:00',
      minutosRestantes: turnoActual === 'M' 
        ? morningEnd - currentTime 
        : eveningEnd - currentTime
    }

  } catch (error) {
    console.error('Error al obtener trabajador actual:', error)
    return null
  }
}
