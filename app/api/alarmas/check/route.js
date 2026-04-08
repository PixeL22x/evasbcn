import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/alarmas/check?trabajador=NombreWorker
 * 
 * Endpoint de polling para los workers.
 * Devuelve alarmas activas que deben dispararse AHORA (±2 minutos)
 * que el trabajador no haya descartado hoy.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trabajadorNombre = searchParams.get('trabajador')

    if (!trabajadorNombre) {
      return NextResponse.json({ error: 'Parámetro trabajador requerido' }, { status: 400 })
    }

    // Hora actual en timezone Europe/Madrid (Barcelona)
    // Se usa toLocaleString('en-US') que siempre devuelve formato legible y parseable
    const ahora = new Date()
    const barcelonaStr = ahora.toLocaleString('en-US', { timeZone: 'Europe/Madrid' })
    const barcelonaDate = new Date(barcelonaStr)

    const horaActual = barcelonaDate.getHours()
    const minActual = barcelonaDate.getMinutes()
    const totalMinutosActual = horaActual * 60 + minActual

    // Inicio del día de hoy en UTC para comparar disparos
    // Tomamos medianoche Barcelona y la convertimos a UTC
    const hoyBarcelona = new Date(barcelonaStr)
    hoyBarcelona.setHours(0, 0, 0, 0)
    // Ajustamos offset: la diferencia entre UTC y Barcelona
    const offsetMs = ahora.getTime() - barcelonaDate.getTime()
    const hoyUTCInicio = new Date(hoyBarcelona.getTime() + offsetMs)

    // Obtener todas las alarmas activas
    const alarmasActivas = await prisma.alarmaTimer.findMany({
      where: { activa: true },
    })

    // Disparos descartados hoy por este trabajador
    const disparosHoy = await prisma.disparoAlarma.findMany({
      where: {
        trabajadorNombre,
        fecha: { gte: hoyUTCInicio },
        descartada: true,
      },
      select: { alarmaId: true },
    })

    const alarmasDescartadasHoy = new Set(disparosHoy.map((d) => d.alarmaId))

    // Filtrar alarmas que corresponden a la hora actual (±2 min)
    const alarmasADisparar = alarmasActivas.filter((alarma) => {
      // No disparar si ya fue descartada hoy
      if (alarmasDescartadasHoy.has(alarma.id)) return false

      // Parsear hora de la alarma (siempre "HH:mm" guardado por el form)
      const partes = alarma.hora.split(':')
      if (partes.length !== 2) return false

      const horaAlarma = parseInt(partes[0], 10)
      const minAlarma = parseInt(partes[1], 10)

      if (isNaN(horaAlarma) || isNaN(minAlarma)) return false

      const totalMinutosAlarma = horaAlarma * 60 + minAlarma
      const diff = Math.abs(totalMinutosActual - totalMinutosAlarma)

      // Ventana de ±2 minutos
      if (diff > 2) return false

      // Si es de una sola vez, verificar que la fecha coincide con hoy Barcelona
      if (alarma.recurrencia === 'unica') {
        if (!alarma.fechaUnica) return false
        const fechaAlarma = new Date(alarma.fechaUnica)
        return (
          fechaAlarma.getFullYear() === barcelonaDate.getFullYear() &&
          fechaAlarma.getMonth() === barcelonaDate.getMonth() &&
          fechaAlarma.getDate() === barcelonaDate.getDate()
        )
      }

      return true // recurrencia diaria
    })

    return NextResponse.json({ alarmas: alarmasADisparar })
  } catch (error) {
    console.error('Error al verificar alarmas:', error)
    return NextResponse.json({ error: 'Error al verificar alarmas' }, { status: 500 })
  }
}
