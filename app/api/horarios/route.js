import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format, parseISO } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { getBarcelonaTimeInfo } from '@/lib/utils'

function getDaysInMonth(anio, mes) {
  // mes: 1-12 - Usar zona horaria de Barcelona
  const barcelonaTimeZone = 'Europe/Madrid'
  
  // Crear fecha en zona horaria de Barcelona
  const barcelonaDate = new Date(anio, mes - 1, 1)
  const utcDate = fromZonedTime(barcelonaDate, barcelonaTimeZone)
  
  const days = []
  let currentDate = new Date(anio, mes - 1, 1)
  
  while (currentDate.getMonth() === mes - 1) {
    const utcDayDate = fromZonedTime(currentDate, barcelonaTimeZone)
    const iso = utcDayDate.toISOString().slice(0, 10)
    const dayOfWeek = currentDate.getDay() // 0..6
    const dayOfMonth = currentDate.getDate()
    days.push({ iso, dayOfWeek, dayOfMonth })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return days
}

// GET /api/horarios?mes=10&anio=2025&trabajadorId=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || '0', 10)
    const anio = parseInt(searchParams.get('anio') || '0', 10)
    const trabajadorId = searchParams.get('trabajadorId') || null

    if (!mes || !anio) {
      return NextResponse.json({ error: 'Parámetros mes y anio requeridos' }, { status: 400 })
    }

    const days = getDaysInMonth(anio, mes)

    if (!trabajadorId) {
      // Without trabajador, just return calendar days
      return NextResponse.json({ days })
    }

    // Fetch weekly rules
    const reglas = await prisma.reglaHorario.findMany({
      where: { trabajadorId },
    })
    const reglaByDow = new Map()
    for (const r of reglas) {
      reglaByDow.set(r.diaSemana, r.turno)
    }

    // Fetch exceptions in month range - Usar zona horaria de Barcelona
    const barcelonaTimeZone = 'Europe/Madrid'
    const monthStartBarcelona = new Date(anio, mes - 1, 1)
    const monthEndBarcelona = new Date(anio, mes, 1)
    
    // Convertir a UTC para la consulta a la base de datos
    const monthStart = fromZonedTime(monthStartBarcelona, barcelonaTimeZone)
    const monthEnd = fromZonedTime(monthEndBarcelona, barcelonaTimeZone)
    
    const excepciones = await prisma.excepcionHorario.findMany({
      where: {
        trabajadorId,
        fecha: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    })
    const excByIso = new Map()
    for (const e of excepciones) {
      const iso = new Date(e.fecha).toISOString().slice(0, 10)
      excByIso.set(iso, e.turno)
    }

    const computed = days.map((d) => {
      let turno = reglaByDow.get(d.dayOfWeek) || 'L'
      if (excByIso.has(d.iso)) turno = excByIso.get(d.iso)
      return { fecha: d.iso, dia: d.dayOfMonth, dow: d.dayOfWeek, turno }
    })

    return NextResponse.json({ days: computed })
  } catch (error) {
    console.error('Error GET /api/horarios', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 })
  }
}











