import { NextResponse } from 'next/server'

// Configuración del bot de Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(request) {
  try {
    const { cierreId, trabajador, turno, totalVentas, fechaFin, fotos } = await request.json()

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('⚠️ Variables de Telegram no configuradas')
      return NextResponse.json({ message: 'Telegram no configurado' }, { status: 200 })
    }

    // Crear mensaje de resumen
    const mensaje = `
🎉 *CIERRE COMPLETADO*

👤 *Trabajador:* ${trabajador}
🕐 *Turno:* ${turno}
💰 *Ventas Totales:* €${totalVentas}
📅 *Fecha:* ${new Date(fechaFin).toLocaleDateString('es-ES')}
🕒 *Hora:* ${new Date(fechaFin).toLocaleTimeString('es-ES')}

${fotos && fotos.length > 0 ? `📸 *Fotos subidas:* ${fotos.length}` : ''}

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
