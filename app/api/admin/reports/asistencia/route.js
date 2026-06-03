import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/reports/asistencia?mes=2025-05&trabajador=todos
 *
 * Cruza el planning (ReglaHorario + ExcepcionHorario) con los Cierres reales
 * para determinar si cada trabajador asistió a los turnos planificados.
 *
 * Estados por día:
 *  - "presente" → planificado + cierre ✅
 *  - "ausente"  → planificado + sin cierre ❌
 *  - "extra"    → cierre sin planificar ⚠️
 *  - "libre"    → día libre, sin cierre ⬜
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const mesParam = searchParams.get('mes') || ''
    const trabajadorParam = searchParams.get('trabajador') || 'todos'

    let year, month
    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      ;[year, month] = mesParam.split('-').map(Number)
    } else {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth() + 1
    }

    const diasEnMes = new Date(year, month, 0).getDate()

    // Rango del mes completo
    const fechaInicio = new Date(Date.UTC(year, month - 1, 1))
    const fechaFin = new Date(Date.UTC(year, month, 1))

    // ── 1. Obtener trabajadores activos ──────────────────────────────────────
    const whereWorker =
      trabajadorParam !== 'todos'
        ? { nombre: trabajadorParam, activo: true }
        : { activo: true }

    const trabajadores = await prisma.trabajador.findMany({
      where: whereWorker,
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    })

    if (trabajadores.length === 0) {
      return NextResponse.json({
        mes: `${year}-${String(month).padStart(2, '0')}`,
        year, month, diasEnMes,
        trabajadores: [],
        totalCierres: 0,
      })
    }

    const trabajadorIds = trabajadores.map(t => t.id)
    const trabajadorNombres = trabajadores.map(t => t.nombre)

    // ── 2. Obtener planning ──────────────────────────────────────────────────
    const [reglas, excepciones] = await Promise.all([
      prisma.reglaHorario.findMany({
        where: { trabajadorId: { in: trabajadorIds } },
      }),
      prisma.excepcionHorario.findMany({
        where: {
          trabajadorId: { in: trabajadorIds },
          fecha: { gte: fechaInicio, lt: fechaFin },
        },
      }),
    ])

    // ── 3. Obtener cierres del mes ───────────────────────────────────────────
    const cierres = await prisma.cierre.findMany({
      where: {
        trabajador: { in: trabajadorNombres },
        fechaInicio: { gte: fechaInicio, lt: fechaFin },
      },
      select: {
        id: true,
        trabajador: true,
        turno: true,
        fechaInicio: true,
        completado: true,
        totalVentas: true,
      },
    })

    // ── Helpers ──────────────────────────────────────────────────────────────

    // Día del mes en zona horaria de España
    const getDia = (date) =>
      parseInt(
        new Date(date).toLocaleDateString('es-ES', {
          timeZone: 'Europe/Madrid',
          day: 'numeric',
        })
      )

    // Mapa: trabajadorId → { diaSemana → turno ("M","T","L","N") }
    const reglaMap = {}
    for (const r of reglas) {
      if (!reglaMap[r.trabajadorId]) reglaMap[r.trabajadorId] = {}
      reglaMap[r.trabajadorId][r.diaSemana] = r.turno
    }

    // Mapa: trabajadorId → { dia → turno }
    const excepcionMap = {}
    for (const e of excepciones) {
      const dia = getDia(e.fecha)
      if (!excepcionMap[e.trabajadorId]) excepcionMap[e.trabajadorId] = {}
      excepcionMap[e.trabajadorId][dia] = e.turno
    }

    // Mapa: nombre → { dia → [cierres] }
    const cierreMap = {}
    for (const c of cierres) {
      const dia = getDia(c.fechaInicio)
      if (!cierreMap[c.trabajador]) cierreMap[c.trabajador] = {}
      if (!cierreMap[c.trabajador][dia]) cierreMap[c.trabajador][dia] = []
      cierreMap[c.trabajador][dia].push(c)
    }

    // Turno planificado para un trabajador en un día concreto
    const getPlanificado = (trabajadorId, dia) => {
      // Excepción tiene prioridad
      const exc = excepcionMap[trabajadorId]?.[dia]
      if (exc !== undefined) return exc === 'DELETE' ? null : exc
      // Regla semanal
      const diaSemana = new Date(year, month - 1, dia).getDay()
      return reglaMap[trabajadorId]?.[diaSemana] ?? null
    }

    // ── 4. Construir resultado ───────────────────────────────────────────────
    const resultado = trabajadores.map(t => {
      const dias = {}
      let totalPlanificados = 0
      let totalConCierre = 0
      let totalAusencias = 0
      let totalExtras = 0

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const turno = getPlanificado(t.id, dia)  // "M", "T", "L", "N" o null
        const esLibre = !turno || turno === 'L'
        const cierresDia = cierreMap[t.nombre]?.[dia] || []
        const tieneCierre = cierresDia.length > 0

        let estado
        if (!esLibre && tieneCierre) {
          estado = 'presente'
          totalPlanificados++
          totalConCierre++
        } else if (!esLibre && !tieneCierre) {
          estado = 'ausente'
          totalPlanificados++
          totalAusencias++
        } else if (esLibre && tieneCierre) {
          estado = 'extra'
          totalExtras++
          totalConCierre++
        } else {
          estado = 'libre'
        }

        dias[dia] = {
          planificado: esLibre ? null : turno,  // "M", "T", "N" o null
          cierres: cierresDia,
          estado,
        }
      }

      return {
        nombre: t.nombre,
        dias,
        resumen: {
          totalPlanificados,
          totalConCierre,
          totalAusencias,
          totalExtras,
        },
      }
    })

    return NextResponse.json({
      mes: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      diasEnMes,
      trabajadores: resultado,
      totalCierres: cierres.length,
    })
  } catch (error) {
    console.error('Error en /api/admin/reports/asistencia:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
