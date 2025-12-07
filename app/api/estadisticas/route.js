import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') // YYYY-MM-DD
    const trabajador = searchParams.get('trabajador')
    const turno = searchParams.get('turno')
    
    // Force redeploy - fix for production

    // Construir filtros
    const where = {}
    
    if (fecha) {
      const startDate = new Date(fecha)
      const endDate = new Date(fecha)
      endDate.setDate(endDate.getDate() + 1)
      
      where.fechaInicio = {
        gte: startDate,
        lt: endDate
      }
    }

    if (trabajador) {
      where.trabajador = trabajador
    }

    if (turno) {
      where.turno = turno
    }

    // Obtener cierres con filtros
    const cierres = await prisma.cierre.findMany({
      where,
      include: {
        tareas: {
          where: { requiereFotos: true }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    })

    // Calcular estadísticas
    const estadisticas = {
      totalCierres: cierres.length,
      cierresCompletados: cierres.filter(c => c.completado).length,
      totalVentas: cierres.reduce((sum, c) => sum + (c.totalVentas || 0), 0),
      promedioVentas: 0,
      trabajadores: [...new Set(cierres.map(c => c.trabajador))],
      turnos: [...new Set(cierres.map(c => c.turno))],
      totalFotos: cierres.reduce((sum, c) => 
        sum + c.tareas.reduce((taskSum, t) => taskSum + (t.fotosSubidas?.length || 0), 0), 0
      ),
      cierres: cierres.map(cierre => ({
        id: cierre.id,
        trabajador: cierre.trabajador,
        turno: cierre.turno,
        fechaInicio: cierre.fechaInicio,
        fechaFin: cierre.fechaFin,
        totalVentas: cierre.totalVentas,
        completado: cierre.completado,
        totalFotos: cierre.tareas.reduce((sum, t) => sum + (t.fotosSubidas?.length || 0), 0),
        duracionMinutos: cierre.fechaFin ? 
          Math.round((new Date(cierre.fechaFin) - new Date(cierre.fechaInicio)) / 60000) : null
      }))
    }

    // Calcular promedio de ventas
    if (estadisticas.totalCierres > 0) {
      estadisticas.promedioVentas = Math.round(estadisticas.totalVentas / estadisticas.totalCierres * 100) / 100
    }

    return NextResponse.json(estadisticas)

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { fecha, trabajador, turno } = await request.json()

    // Crear mensaje de estadísticas para Telegram
    const statsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/estadisticas?${new URLSearchParams({
      ...(fecha && { fecha }),
      ...(trabajador && { trabajador }),
      ...(turno && { turno })
    })}`)

    const stats = await statsResponse.json()

    if (!stats.totalCierres) {
      return NextResponse.json({
        success: false,
        message: 'No hay datos para el período seleccionado'
      })
    }

    // Obtener comparativa con el día anterior para el último cierre
    let comparativaMensaje = ''
    if (stats.cierres.length > 0) {
      const ultimoCierre = stats.cierres[0]
      const fechaUltimoCierre = new Date(ultimoCierre.fechaInicio)
      const fechaAnterior = new Date(fechaUltimoCierre)
      fechaAnterior.setDate(fechaAnterior.getDate() - 1)

      const cierreAnterior = await prisma.cierre.findFirst({
        where: {
          trabajador: ultimoCierre.trabajador,
          turno: ultimoCierre.turno,
          fechaInicio: {
            gte: new Date(fechaAnterior.getFullYear(), fechaAnterior.getMonth(), fechaAnterior.getDate()),
            lt: new Date(fechaAnterior.getFullYear(), fechaAnterior.getMonth(), fechaAnterior.getDate() + 1)
          },
          completado: true
        },
        orderBy: { fechaInicio: 'desc' }
      })

      if (cierreAnterior && cierreAnterior.totalVentas) {
        const ventasActuales = parseFloat(ultimoCierre.totalVentas) || 0
        const ventasAnteriores = parseFloat(cierreAnterior.totalVentas) || 0
        const diferencia = ventasActuales - ventasAnteriores
        const porcentaje = Math.round((diferencia / ventasAnteriores) * 100)

        let emoji = '📊'
        if (porcentaje > 0) emoji = '📈'
        else if (porcentaje < 0) emoji = '📉'
        else emoji = '➡️'

        comparativaMensaje = `
📊 *Comparativa último cierre:*
${emoji} ${porcentaje > 0 ? `+${porcentaje}%` : porcentaje < 0 ? `${porcentaje}%` : 'Igual'} vs día anterior (€${ventasAnteriores})
        `.trim()
      }
    }

    const mensaje = `
📊 *ESTADÍSTICAS DE VENTAS*

${fecha ? `📅 *Fecha:* ${fecha}` : ''}
${trabajador ? `👤 *Trabajador:* ${trabajador}` : ''}
${turno ? `🕐 *Turno:* ${turno}` : ''}

📈 *Resumen:*
• Total de cierres: ${stats.totalCierres}
• Cierres completados: ${stats.cierresCompletados}
• Ventas totales: €${stats.totalVentas}
• Promedio por cierre: €${stats.promedioVentas}

${comparativaMensaje}

${stats.cierres.length > 0 ? `
📋 *Últimos cierres:*
${stats.cierres.slice(0, 5).map(c => 
  `• ${c.trabajador} (${c.turno}): €${c.totalVentas || 0} - ${new Date(c.fechaInicio).toLocaleDateString('es-ES')}`
).join('\n')}
` : ''}
    `.trim()

    // Enviar a Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      return NextResponse.json({
        success: false,
        message: 'Telegram no configurado'
      })
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    })

    const result = await telegramResponse.json()

    if (!result.ok) {
      throw new Error(result.description || 'Error enviando a Telegram')
    }

    return NextResponse.json({
      success: true,
      message: 'Estadísticas enviadas a Telegram',
      messageId: result.result.message_id
    })

  } catch (error) {
    console.error('Error enviando estadísticas:', error)
    return NextResponse.json({
      success: false,
      message: 'Error enviando estadísticas',
      error: error.message
    }, { status: 500 })
  }
}
