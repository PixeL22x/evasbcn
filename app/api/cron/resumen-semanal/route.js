import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Utilidades de fecha en hora España ────────────────────────────────────

/**
 * Devuelve el inicio y fin (UTC) de la semana anterior (lun–dom)
 * respecto a una fecha dada expresada en hora Madrid.
 */
import { startOfWeek, subWeeks, endOfWeek } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

function getSemanasUTC() {
  const timeZone = 'Europe/Madrid'
  const now = new Date()
  
  // Convert current time to Madrid time conceptually
  const nowMadrid = toZonedTime(now, timeZone)
  
  // Last week's Monday 00:00:00 in Madrid
  const lunesSemanaAnteriorMadrid = startOfWeek(subWeeks(nowMadrid, 1), { weekStartsOn: 1 })
  const inicioSemanaAnteriorUTC = fromZonedTime(lunesSemanaAnteriorMadrid, timeZone)
  
  // Last week's Sunday 23:59:59.999 in Madrid
  const domingoSemanaAnteriorMadrid = endOfWeek(subWeeks(nowMadrid, 1), { weekStartsOn: 1 })
  const finSemanaAnteriorUTC = fromZonedTime(domingoSemanaAnteriorMadrid, timeZone)
  
  // 2 weeks ago Monday
  const lunesHaceDosSemanaMadrid = startOfWeek(subWeeks(nowMadrid, 2), { weekStartsOn: 1 })
  const inicioHaceDosSemanasUTC = fromZonedTime(lunesHaceDosSemanaMadrid, timeZone)

  return {
    semanaActual: {
      inicio: inicioSemanaAnteriorUTC,
      fin: finSemanaAnteriorUTC,
      label: formatRangoSemana(lunesSemanaAnteriorMadrid, domingoSemanaAnteriorMadrid),
      numeroSemana: getNumeroSemana(lunesSemanaAnteriorMadrid),
    },
    semanaAnterior: {
      inicio: inicioHaceDosSemanasUTC,
      fin: inicioSemanaAnteriorUTC,
    },
  }
}

function formatRangoSemana(inicio, fin) {
  const opts = { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }
  const i = inicio.toLocaleDateString('es-ES', opts)
  const f = fin.toLocaleDateString('es-ES', opts)
  return `${i} – ${f}`
}

function getNumeroSemana(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function formatEuro(num) {
  return `€${Number(num).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Handler principal ──────────────────────────────────────────────────────

export async function GET(request) {
  // ── Protección con CRON_SECRET ──────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get('secret')

    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    if (tokenFromHeader !== cronSecret && secretParam !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Variables de Telegram ───────────────────────────────────────────────
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID   = process.env.TELEGRAM_CHAT_ID

  if (!BOT_TOKEN || !CHAT_ID) {
    return NextResponse.json({ error: 'Telegram no configurado' }, { status: 500 })
  }

  try {
    const { semanaActual, semanaAnterior } = getSemanasUTC()

    // ── Consultas a la BD ─────────────────────────────────────────────────
    const [cierresActuales, cierresAnteriores] = await Promise.all([
      prisma.cierre.findMany({
        where: {
          completado: true,
          turno: 'tarde',
          fechaFin: { gte: semanaActual.inicio, lte: semanaActual.fin },
        },
        select: { trabajador: true, turno: true, totalVentas: true },
      }),
      prisma.cierre.findMany({
        where: {
          completado: true,
          turno: 'tarde',
          fechaFin: { gte: semanaAnterior.inicio, lt: semanaAnterior.fin },
        },
        select: { totalVentas: true },
      }),
    ])

    // ── Cálculos semana actual ────────────────────────────────────────────
    const totalActual = cierresActuales.reduce((s, c) => s + (c.totalVentas || 0), 0)
    const totalAnterior = cierresAnteriores.reduce((s, c) => s + (c.totalVentas || 0), 0)

    // Comparativa
    let comparativaLinea = ''
    if (totalAnterior > 0) {
      const diff = totalActual - totalAnterior
      const pct  = Math.round((diff / totalAnterior) * 100)
      const emoji = pct > 0 ? '📈' : pct < 0 ? '📉' : '➡️'
      const signo = pct > 0 ? '+' : ''
      comparativaLinea = `${emoji} <b>${signo}${pct}%</b> vs semana anterior (${formatEuro(totalAnterior)})`
    } else {
      comparativaLinea = `📊 Sin datos de la semana anterior para comparar`
    }



    // ── Construcción del mensaje ──────────────────────────────────────────
    const mensaje = [
      `📊 <b>RESUMEN SEMANAL</b>`,
      `Semana ${semanaActual.numeroSemana} · ${semanaActual.label}`,
      ``,
      `💰 <b>Ventas totales: ${formatEuro(totalActual)}</b>`,
      comparativaLinea,
    ].join('\n')

    // ── Envío a Telegram ──────────────────────────────────────────────────
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: mensaje,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    )

    if (!telegramRes.ok) {
      const err = await telegramRes.json()
      console.error('❌ Error enviando resumen semanal a Telegram:', err)
      return NextResponse.json({ error: 'Error enviando a Telegram', detail: err }, { status: 500 })
    }

    console.log('✅ Resumen semanal enviado a Telegram')
    return NextResponse.json({
      ok: true,
      semana: semanaActual.label,
      totalVentas: totalActual,
    })

  } catch (error) {
    console.error('❌ Error en resumen semanal:', error)
    return NextResponse.json({ error: 'Error interno', detail: error.message }, { status: 500 })
  }
}
