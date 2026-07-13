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
        tipo: 'cierre',
        fechaFin: { gte: startOfDay }
      },
      select: { fechaFin: true, turno: true, totalVentas: true, completado: true },
      orderBy: { fechaFin: 'desc' }
    })
    console.log('Cierres desde startOfDay:', cierresHoy)

    // Ventas del turno mañana (solo turno mañana para evitar duplicación)
    const ventasTurnoMananaResult = await prisma.cierre.aggregate({
      _sum: { totalVentas: true },
      where: {
        tipo: 'cierre',
        completado: true,
        fechaFin: { gte: startOfDay },
        totalVentas: { not: null },
        turno: "mañana"
      }
    })

    // Total de trabajadores activos
    const totalTrabajadores = await prisma.trabajador.count({
      where: {
        activo: true
      }
    })

    // Ventas de hoy — solo el turno de cierre del día (tarde o noche)
    // El ticket total del día lo escanea SIEMPRE el último turno.
    // Nunca sumamos "mañana" para evitar doble conteo.
    const ventasHoyResult = await prisma.cierre.aggregate({
      _sum: { totalVentas: true },
      where: {
        tipo: 'cierre',
        completado: true,
        fechaFin: { gte: startOfDay },
        totalVentas: { not: null },
        turno: { in: ['tarde', 'noche'] }
      }
    })

    // Trabajadores de turno activos (puede ser más de uno en caso de solapamiento)
    const turnosActivos = await getTurnosActivos()

    // Obtener últimas 5 ventas (cierres completados)
    const recentSales = await prisma.cierre.findMany({
      where: {
        tipo: 'cierre',
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
        trabajador: true
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
      // Compatibilidad retroactiva: trabajadorActual = primer activo o null
      trabajadorActual: turnosActivos[0] ?? null,
      // Nuevo campo: todos los turnos activos (para solapamientos)
      turnosActivos,
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

// ─────────────────────────────────────────────────────────────────────────────
// Devuelve TODOS los turnos activos ahora (array — soporta solapamientos)
// ─────────────────────────────────────────────────────────────────────────────
async function getTurnosActivos() {
  try {
    const timeInfo = getBarcelonaTimeInfo()
    const { hour: currentHour, minute: currentMinute, timeInMinutes: currentTime, dayOfWeek, today } = timeInfo

    // 1. Cargar configuración dinámica
    let turnosConfig = {
      M: {
        0: { hours: 5.5, start: '11:30', end: '17:00' },
        1: { hours: 4.5, start: '12:30', end: '17:00' },
        2: { hours: 4.5, start: '12:30', end: '17:00' },
        3: { hours: 4.5, start: '12:30', end: '17:00' },
        4: { hours: 4.5, start: '12:30', end: '17:00' },
        5: { hours: 4.5, start: '12:30', end: '17:00' },
        6: { hours: 5.5, start: '11:30', end: '17:00' }
      },
      T: {
        0: { hours: 6, start: '17:00', end: '23:00' },
        1: { hours: 6, start: '17:00', end: '23:00' },
        2: { hours: 6, start: '17:00', end: '23:00' },
        3: { hours: 6, start: '17:00', end: '23:00' },
        4: { hours: 6, start: '17:00', end: '23:00' },
        5: { hours: 6, start: '17:00', end: '23:00' },
        6: { hours: 6, start: '17:00', end: '23:00' }
      },
      // Turno noche por defecto (viernes=5, sábado=6, domingo=0)
      N: {
        0: { hours: 5, start: '18:00', end: '23:00' },
        1: { hours: 0, start: '00:00', end: '00:00' },
        2: { hours: 0, start: '00:00', end: '00:00' },
        3: { hours: 0, start: '00:00', end: '00:00' },
        4: { hours: 0, start: '00:00', end: '00:00' },
        5: { hours: 5, start: '18:30', end: '23:30' },
        6: { hours: 5, start: '18:30', end: '23:30' }
      }
    }

    try {
      const config = await prisma.configuracion.findUnique({
        where: { clave: 'horarios_active_profile' }
      })
      if (config?.valor?.shifts) {
        turnosConfig = config.valor.shifts
      }
    } catch (e) {
      console.warn('⚠️ Error cargando configuración:', e.message)
    }

    // 2. Helper: hh:mm → minutos
    const timeToMinutes = (t) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    // 3. Resolver ventana horaria de un turno para el día actual
    const getSchedule = (turnoKey) => {
      const cfg = turnosConfig[turnoKey]?.[dayOfWeek]
      if (!cfg || cfg.hours === 0) return null
      return {
        start: timeToMinutes(cfg.start),
        end: timeToMinutes(cfg.end),
        startStr: cfg.start,
        endStr: cfg.end
      }
    }

    const schedules = {
      M: getSchedule('M'),
      T: getSchedule('T'),
      N: getSchedule('N')
    }

    const turnoLabel = { M: 'Mañana', T: 'Tarde', N: 'Noche' }

    // 4. Buscar trabajadores activos con sus reglas
    const trabajadores = await prisma.trabajador.findMany({
      where: { activo: true },
      include: { reglasHorario: true, excepcionesHorario: true }
    })

    // 5. Determinar el turno de cada trabajador hoy
    const turnosHoy = []
    for (const t of trabajadores) {
      const excepcion = t.excepcionesHorario.find(exc =>
        exc.fecha.toISOString().split('T')[0] === today
      )
      const turnoAsignado = excepcion
        ? excepcion.turno
        : t.reglasHorario.find(r => r.diaSemana === dayOfWeek)?.turno

      if (turnoAsignado && turnoAsignado !== 'L') {
        turnosHoy.push({ nombre: t.nombre, turno: turnoAsignado })
      }
    }

    console.log('🔍 Turnos hoy:', turnosHoy, '| Hora actual:', `${currentHour}:${String(currentMinute).padStart(2, '0')}`)

    // 6. Clasificar cada turno como activo / próximo / finalizado
    const activos = []
    const proximos = []

    for (const { nombre, turno } of turnosHoy) {
      const sch = schedules[turno]
      if (!sch) continue

      const isActive = currentTime >= sch.start && currentTime < sch.end

      if (isActive) {
        activos.push({
          nombre,
          turno: turnoLabel[turno] ?? turno,
          horaInicio: sch.startStr,
          horaFin: sch.endStr,
          minutosRestantes: sch.end - currentTime
        })
      } else if (currentTime < sch.start) {
        proximos.push({
          nombre,
          turno: turnoLabel[turno] ?? turno,
          horaInicio: sch.startStr,
          horaFin: sch.endStr,
          minutosRestantes: sch.start - currentTime,
          proximo: true
        })
      }
    }

    // Si hay activos, devolver solo activos
    if (activos.length > 0) return activos

    // Si no hay activos, devolver el/los próximos ordenados por hora de inicio
    if (proximos.length > 0) {
      return proximos.sort((a, b) => a.minutosRestantes - b.minutosRestantes)
    }

    return []

  } catch (error) {
    console.error('Error al obtener turnos activos:', error)
    return []
  }
}
