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

    // Obtener últimas 5 ventas (cierres completados)
    const recentSales = await prisma.cierre.findMany({
      where: {
        completado: true,
        totalVentas: { gt: 0 }
      },
      orderBy: { fechaFin: 'desc' },
      take: 5,
      select: {
        id: true,
        fechaFin: true,
        totalVentas: true,
        turno: true,
        trabajador: true  // trabajador is a String field, not a relation
      }
    })

    // Transform to match expected format (trabajador.nombre)
    const recentSalesFormatted = recentSales.map(sale => ({
      ...sale,
      trabajador: { nombre: sale.trabajador }
    }))

    return NextResponse.json({
      ventasTurnoManana: ventasTurnoMananaResult._sum.totalVentas || 0,
      totalTrabajadores,
      ventasHoy: ventasHoyResult._sum.totalVentas || 0,
      trabajadorActual,
      recentSales: recentSalesFormatted
    })

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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

    // 1. CARGAR CONFIGURACIÓN DINÁMICA DE HORARIOS
    let turnosConfig = {
      M: {
        0: { hours: 5.5, start: '11:30', end: '17:00' }, // Domingo
        1: { hours: 4.5, start: '12:30', end: '17:00' }, // Lunes
        2: { hours: 4.5, start: '12:30', end: '17:00' },
        3: { hours: 4.5, start: '12:30', end: '17:00' },
        4: { hours: 4.5, start: '12:30', end: '17:00' },
        5: { hours: 4.5, start: '12:30', end: '17:00' },
        6: { hours: 5.5, start: '11:30', end: '17:00' }  // Sábado
      },
      T: {
        0: { hours: 6, start: '17:00', end: '23:00' },
        1: { hours: 6, start: '17:00', end: '23:00' },
        2: { hours: 6, start: '17:00', end: '23:00' },
        3: { hours: 6, start: '17:00', end: '23:00' },
        4: { hours: 6, start: '17:00', end: '23:00' },
        5: { hours: 6, start: '17:00', end: '23:00' },
        6: { hours: 6, start: '17:00', end: '23:00' }
      }
    }

    try {
      const config = await prisma.configuracion.findUnique({
        where: { clave: 'horarios_active_profile' }
      })
      if (config?.valor?.shifts) {
        turnosConfig = config.valor.shifts
        console.log('✅ Configuración de horarios cargada desde BD')
      }
    } catch (e) {
      console.warn('⚠️ Error cargando configuración, usando horarios por defecto:', e.message)
    }

    // 2. HELPER: Convertir hora "HH:MM" a minutos desde medianoche
    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    // 3. OBTENER HORARIOS DEL DÍA ACTUAL
    const getMorningSchedule = () => {
      const config = turnosConfig.M?.[dayOfWeek]
      if (!config || config.hours === 0) return null
      return {
        start: timeToMinutes(config.start),
        end: timeToMinutes(config.end),
        startStr: config.start,
        endStr: config.end
      }
    }

    const getEveningSchedule = () => {
      const config = turnosConfig.T?.[dayOfWeek]
      if (!config || config.hours === 0) return null
      return {
        start: timeToMinutes(config.start),
        end: timeToMinutes(config.end),
        startStr: config.start,
        endStr: config.end
      }
    }

    const morningSchedule = getMorningSchedule()
    const eveningSchedule = getEveningSchedule()

    console.log('📅 Horarios configurados para hoy (día', dayOfWeek, '):', {
      mañana: morningSchedule,
      tarde: eveningSchedule
    })

    // 4. BUSCAR TRABAJADORES ACTIVOS
    const trabajadores = await prisma.trabajador.findMany({
      where: { activo: true },
      include: {
        reglasHorario: true,
        excepcionesHorario: true
      }
    })

    // 5. RECOPILAR TURNOS ASIGNADOS PARA HOY
    const turnosHoy = []

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

      // Solo agregar si hay un turno asignado (M o T, no L)
      if (turnoAsignado && turnoAsignado !== 'L') {
        turnosHoy.push({
          trabajador: trabajador.nombre,
          turno: turnoAsignado
        })
      }
    }

    console.log('🔍 Turnos asignados para hoy:', turnosHoy)
    console.log('⏰ Hora actual:', `${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTime} minutos)`)

    // 6. SI NO HAY TURNOS ASIGNADOS, RETORNAR NULL
    if (turnosHoy.length === 0) {
      console.log('❌ No hay turnos asignados para hoy')
      return null
    }

    // 7. VERIFICAR SI ALGÚN TURNO ESTÁ ACTIVO AHORA
    for (const { trabajador, turno } of turnosHoy) {
      let isActive = false
      let horaInicio, horaFin, minutosRestantes

      if (turno === 'M' && morningSchedule) {
        isActive = currentTime >= morningSchedule.start && currentTime < morningSchedule.end
        horaInicio = morningSchedule.startStr
        horaFin = morningSchedule.endStr
        minutosRestantes = morningSchedule.end - currentTime
      } else if (turno === 'T' && eveningSchedule) {
        isActive = currentTime >= eveningSchedule.start && currentTime < eveningSchedule.end
        horaInicio = eveningSchedule.startStr
        horaFin = eveningSchedule.endStr
        minutosRestantes = eveningSchedule.end - currentTime
      }

      if (isActive) {
        console.log('✅ Turno activo encontrado:', { trabajador, turno, horaInicio, horaFin })
        return {
          nombre: trabajador,
          turno: turno === 'M' ? 'Mañana' : 'Tarde',
          horaInicio,
          horaFin,
          minutosRestantes
        }
      }
    }

    // 8. SI NO HAY TURNO ACTIVO, BUSCAR EL PRÓXIMO
    const turnosMañana = turnosHoy.filter(t => t.turno === 'M')
    const turnosTarde = turnosHoy.filter(t => t.turno === 'T')

    // Si estamos antes del turno de mañana y hay turno de mañana asignado
    if (morningSchedule && currentTime < morningSchedule.start && turnosMañana.length > 0) {
      console.log('⏳ Próximo turno: Mañana')
      return {
        nombre: turnosMañana[0].trabajador,
        turno: 'Mañana',
        horaInicio: morningSchedule.startStr,
        horaFin: morningSchedule.endStr,
        minutosRestantes: morningSchedule.start - currentTime,
        proximo: true
      }
    }

    // Si estamos entre turnos (después de mañana, antes de tarde) y hay turno de tarde
    if (morningSchedule && eveningSchedule && 
        currentTime >= morningSchedule.end && currentTime < eveningSchedule.start && 
        turnosTarde.length > 0) {
      console.log('⏳ Próximo turno: Tarde')
      return {
        nombre: turnosTarde[0].trabajador,
        turno: 'Tarde',
        horaInicio: eveningSchedule.startStr,
        horaFin: eveningSchedule.endStr,
        minutosRestantes: eveningSchedule.start - currentTime,
        proximo: true
      }
    }

    // Si solo hay turno de tarde y estamos antes de que empiece
    if (eveningSchedule && currentTime < eveningSchedule.start && 
        turnosTarde.length > 0 && turnosMañana.length === 0) {
      console.log('⏳ Solo hay turno de tarde hoy, aún no ha comenzado')
      return {
        nombre: turnosTarde[0].trabajador,
        turno: 'Tarde',
        horaInicio: eveningSchedule.startStr,
        horaFin: eveningSchedule.endStr,
        minutosRestantes: eveningSchedule.start - currentTime,
        proximo: true
      }
    }

    // Si estamos después de todos los turnos
    console.log('🌙 Todos los turnos del día han finalizado')
    return null

  } catch (error) {
    console.error('Error al obtener trabajador actual:', error)
    return null
  }
}
