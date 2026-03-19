import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Configuración del bot de Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// Función para obtener comparativa con el día anterior
async function obtenerComparativaVentas(fechaFin, trabajador, turno) {
  try {
    const fechaActual = new Date(fechaFin)
    const fechaAnterior = new Date(fechaActual)
    fechaAnterior.setDate(fechaAnterior.getDate() - 1)

    // Obtener ventas del día anterior (mismo trabajador y turno)
    const cierreAnterior = await prisma.cierre.findFirst({
      where: {
        trabajador: trabajador,
        turno: turno,
        fechaInicio: {
          gte: new Date(fechaAnterior.getFullYear(), fechaAnterior.getMonth(), fechaAnterior.getDate()),
          lt: new Date(fechaAnterior.getFullYear(), fechaAnterior.getMonth(), fechaAnterior.getDate() + 1)
        },
        completado: true
      },
      orderBy: { fechaInicio: 'desc' }
    })

    if (!cierreAnterior || !cierreAnterior.totalVentas) {
      return {
        mensaje: '📈 No hay datos del día anterior para comparar',
        porcentaje: null
      }
    }

    const ventasActuales = parseFloat(totalVentas) || 0
    const ventasAnteriores = parseFloat(cierreAnterior.totalVentas) || 0

    if (ventasAnteriores === 0) {
      return {
        mensaje: '📈 No hay ventas del día anterior para comparar',
        porcentaje: null
      }
    }

    const diferencia = ventasActuales - ventasAnteriores
    const porcentaje = Math.round((diferencia / ventasAnteriores) * 100)

    let emoji = '📊'
    let mensaje = ''

    if (porcentaje > 0) {
      emoji = '📈'
      mensaje = `${emoji} *+${porcentaje}%* vs ayer (€${ventasAnteriores})`
    } else if (porcentaje < 0) {
      emoji = '📉'
      mensaje = `${emoji} *${porcentaje}%* vs ayer (€${ventasAnteriores})`
    } else {
      emoji = '➡️'
      mensaje = `${emoji} *Igual* que ayer (€${ventasAnteriores})`
    }

    return {
      mensaje: mensaje,
      porcentaje: porcentaje,
      ventasAnteriores: ventasAnteriores,
      diferencia: diferencia
    }

  } catch (error) {
    console.error('Error obteniendo comparativa:', error)
    return {
      mensaje: '❌ Error obteniendo comparativa',
      porcentaje: null
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { cierreId, trabajador, turno, totalVentas, fechaFin, message } = body

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('⚠️ Variables de Telegram no configuradas')
      return NextResponse.json({ message: 'Telegram no configurado' }, { status: 200 })
    }

    // Verificar si el bot está habilitado
    const CONFIG_KEY = 'telegram_bot_enabled'
    const config = await prisma.configuracion.findUnique({
      where: { clave: CONFIG_KEY }
    })
    const enabled = config?.valor?.enabled !== false

    if (!enabled) {
      console.log('ℹ️ Bot de Telegram desactivado, no se enviará notificación')
      return NextResponse.json({
        message: 'Bot de Telegram desactivado',
        telegramSent: false,
        disabled: true
      }, { status: 200 })
    }

    // ─── Mensaje genérico (tareas asignadas u otros usos) ───────────────────
    if (!cierreId && message) {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        }
      )
      if (!telegramResponse.ok) {
        const err = await telegramResponse.json()
        console.error('❌ Error enviando mensaje genérico a Telegram:', err)
        return NextResponse.json({ error: 'Error enviando a Telegram' }, { status: 500 })
      }
      console.log('✅ Mensaje genérico enviado a Telegram')
      return NextResponse.json({ message: 'Notificación enviada', telegramSent: true })
    }

    // ─── Notificación de cierre completado (flujo original) ─────────────────
    // Obtener comparativa con el día anterior
    const comparativa = await obtenerComparativaVentas(fechaFin, trabajador, turno)

    // Crear mensaje de resumen
    const mensaje = `
🎉 *CIERRE COMPLETADO*

👤 *Trabajador:* ${trabajador}
🕐 *Turno:* ${turno}
💰 *Ventas Totales:* €${totalVentas || 0}

📊 *Comparativa con día anterior:*
${comparativa.mensaje}

📅 *Fecha:* ${new Date(fechaFin).toLocaleDateString('es-ES')}
🕒 *Hora:* ${new Date(fechaFin).toLocaleTimeString('es-ES')}

✅ *Estado:* Cierre completado exitosamente
    `.trim()

    // Enviar mensaje a Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      console.error('❌ Error enviando a Telegram:', errorData)
      return NextResponse.json({ error: 'Error enviando a Telegram' }, { status: 500 })
    }

    console.log('✅ Notificación enviada a Telegram exitosamente')

    return NextResponse.json({
      message: 'Notificación enviada a Telegram',
      telegramSent: true
    })

  } catch (error) {
    console.error('❌ Error en notificación de Telegram:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      telegramSent: false
    }, { status: 500 })
  }
}

// Endpoint para enviar fotos específicas
export async function PUT(request) {
  try {
    const { tipo, descripcion, url, trabajador } = await request.json()

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ message: 'Telegram no configurado' }, { status: 200 })
    }

    const mensaje = `
📸 *Nueva foto subida*

👤 *Trabajador:* ${trabajador}
📋 *Tipo:* ${descripcion}
🔗 *URL:* ${url}

✅ *Estado:* Foto subida exitosamente
    `.trim()

    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      console.error('❌ Error enviando foto a Telegram:', errorData)
      return NextResponse.json({ error: 'Error enviando a Telegram' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Notificación de foto enviada a Telegram',
      telegramSent: true
    })

  } catch (error) {
    console.error('❌ Error en notificación de foto:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      telegramSent: false
    }, { status: 500 })
  }
}
