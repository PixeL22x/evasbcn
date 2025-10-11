import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getDaysInMonth(year, month) {
  // month: 1-12
  const date = new Date(Date.UTC(year, month - 1, 1))
  const days = []
  while (date.getUTCMonth() === month - 1) {
    const iso = date.toISOString().slice(0, 10)
    const dayOfWeek = date.getUTCDay() // 0..6
    const dayOfMonth = date.getUTCDate()
    days.push({ iso, dayOfWeek, dayOfMonth })
    date.setUTCDate(date.getUTCDate() + 1)
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

    // Fetch exceptions in month range
    const monthStart = new Date(Date.UTC(anio, mes - 1, 1))
    const monthEnd = new Date(Date.UTC(anio, mes, 1))
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









