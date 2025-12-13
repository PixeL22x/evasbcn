/**
 * Script para probar diferentes formatos de botón en Telegram
 */

async function testButtonFormats() {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❌ Variables no configuradas')
        return
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

    // Test 1: Mensaje simple (sabemos que funciona)
    console.log('Test 1: Mensaje simple sin botón...')
    const test1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: '🧪 Test 1: Mensaje simple',
            parse_mode: 'Markdown'
        })
    })
    console.log('  Resultado:', test1.ok ? '✅ OK' : '❌ Error')
    if (!test1.ok) console.log('  Error:', await test1.text())
    console.log('')

    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 2: Mensaje con botón (formato correcto)
    console.log('Test 2: Mensaje con botón URL...')
    const test2 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: '🧪 Test 2: Mensaje con botón',
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📊 Ver Detalles',
                            url: 'https://google.com'
                        }
                    ]
                ]
            }
        })
    })
    console.log('  Resultado:', test2.ok ? '✅ OK' : '❌ Error')
    if (!test2.ok) {
        const errorText = await test2.text()
        console.log('  Error:', errorText)
        try {
            const errorJson = JSON.parse(errorText)
            console.log('  Código:', errorJson.error_code)
            console.log('  Descripción:', errorJson.description)
        } catch (e) { }
    }
    console.log('')

    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 3: Mensaje con botón usando localhost
    console.log('Test 3: Mensaje con botón a localhost...')
    const test3 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: '🧪 Test 3: Botón a localhost',
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📊 Ver Detalles',
                            url: 'http://localhost:3000/admin/cierres'
                        }
                    ]
                ]
            }
        })
    })
    console.log('  Resultado:', test3.ok ? '✅ OK' : '❌ Error')
    if (!test3.ok) {
        const errorText = await test3.text()
        console.log('  Error:', errorText)
        try {
            const errorJson = JSON.parse(errorText)
            console.log('  Código:', errorJson.error_code)
            console.log('  Descripción:', errorJson.description)
        } catch (e) { }
    }
    console.log('')

    console.log('✅ Tests completados')
    console.log('📱 Revisa Telegram para ver qué mensajes llegaron')
}

testButtonFormats()
