/**
 * Script para probar el botón de Telegram
 * Simula completar un cierre y enviar notificación con botón
 */

async function testTelegramButton() {
    console.log('🧪 Probando botón de Telegram...\n')

    // Simular datos de un cierre completado
    const testData = {
        trabajador: 'Test Usuario',
        turno: 'tarde',
        totalVentas: 450.50,
        fechaFin: new Date().toISOString()
    }

    console.log('📤 Enviando notificación de prueba...')
    console.log('Datos:', testData)

    // Enviar mensaje directamente a Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❌ Variables de entorno no configuradas')
        console.log('Asegúrate de tener:')
        console.log('- TELEGRAM_BOT_TOKEN')
        console.log('- TELEGRAM_CHAT_ID')
        return
    }

    const fechaBarcelona = new Date(testData.fechaFin).toLocaleString('es-ES', {
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
🎉 *CIERRE COMPLETADO* (TEST)

👤 *Trabajador:* ${testData.trabajador}
🕐 *Turno:* ${testData.turno}
💰 *Ventas Totales:* €${testData.totalVentas}
📅 *Fecha:* ${fecha}
🕒 *Hora:* ${hora}

🧪 *Nota:* Este es un mensaje de prueba
  `.trim()

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: mensaje,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📊 Ver Detalles',
                                    url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/cierres`
                                }
                            ]
                        ]
                    }
                })
            }
        )

        const result = await response.json()

        if (result.ok) {
            console.log('\n✅ Mensaje enviado exitosamente!')
            console.log('📱 Revisa tu Telegram y verifica:')
            console.log('   1. El mensaje se recibió correctamente')
            console.log('   2. Aparece el botón "📊 Ver Detalles"')
            console.log('   3. Al presionar el botón, abre /admin/cierres')
            console.log('\nMessage ID:', result.result.message_id)
        } else {
            console.error('\n❌ Error enviando mensaje:')
            console.error(result)
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    }
}

testTelegramButton()
