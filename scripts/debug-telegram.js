/**
 * Script de debug para probar notificación de Telegram
 * Simula exactamente lo que hace /api/tarea cuando se completa un cierre
 */

async function debugTelegramNotification() {
    console.log('🔍 Debuggeando notificación de Telegram...\n')

    // Verificar variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL

    console.log('📋 Variables de entorno:')
    console.log('  TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ NO configurado')
    console.log('  TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? '✅ Configurado' : '❌ NO configurado')
    console.log('  NEXTAUTH_URL:', NEXTAUTH_URL || 'http://localhost:3000 (default)')
    console.log('')

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❌ Telegram no configurado - no se puede enviar notificación')
        return
    }

    // Simular datos de cierre
    const cierreActualizado = {
        trabajador: 'Debug Test',
        turno: 'tarde',
        totalVentas: 123.45,
        fechaFin: new Date()
    }

    // Crear mensaje (igual que en /api/tarea)
    const fechaBarcelona = new Date(cierreActualizado.fechaFin).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })

    const [fecha, hora] = fechaBarcelona.split(', ')

    const mensaje = `
🎉 *CIERRE COMPLETADO* (DEBUG)

👤 *Trabajador:* ${cierreActualizado.trabajador}
🕐 *Turno:* ${cierreActualizado.turno}
💰 *Ventas Totales:* €${cierreActualizado.totalVentas || 0}
📅 *Fecha:* ${fecha}
🕒 *Hora:* ${hora}
  `.trim()

    console.log('📝 Mensaje a enviar:')
    console.log(mensaje)
    console.log('')

    // Construir payload (igual que en /api/tarea)
    const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '📊 Ver Detalles',
                        url: `${NEXTAUTH_URL || 'http://localhost:3000'}/admin/cierres`
                    }
                ]
            ]
        }
    }

    console.log('📦 Payload completo:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('')

    // Enviar a Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

    console.log('📤 Enviando a Telegram...')
    console.log('URL:', url.replace(TELEGRAM_BOT_TOKEN, '***TOKEN***'))
    console.log('')

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const responseText = await response.text()

        console.log('📥 Respuesta de Telegram:')
        console.log('  Status:', response.status, response.statusText)
        console.log('  OK:', response.ok)
        console.log('')

        if (response.ok) {
            const result = JSON.parse(responseText)
            console.log('✅ Notificación enviada exitosamente!')
            console.log('  Message ID:', result.result.message_id)
            console.log('  Chat ID:', result.result.chat.id)
            console.log('')
            console.log('🎯 Verifica en Telegram:')
            console.log('  1. ¿Recibiste el mensaje?')
            console.log('  2. ¿Aparece el botón "📊 Ver Detalles"?')
            console.log('  3. ¿El botón abre la URL correcta?')
        } else {
            console.error('❌ Error enviando notificación:')
            console.error('  Response:', responseText)

            try {
                const errorData = JSON.parse(responseText)
                console.error('  Error Code:', errorData.error_code)
                console.error('  Description:', errorData.description)
            } catch (e) {
                // No es JSON
            }
        }

    } catch (error) {
        console.error('❌ Error de red:', error.message)
        console.error(error)
    }
}

debugTelegramNotification()
