#!/usr/bin/env node

/**
 * Script para configurar el bot de Telegram
 * Uso: node scripts/setup-telegram.js
 */

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupTelegram() {
  console.log('🤖 Configuración del Bot de Telegram para Evas Barcelona')
  console.log('=' .repeat(60))
  
  console.log('\n📋 Paso 1: Crear el bot')
  console.log('1. Abre Telegram y busca @BotFather')
  console.log('2. Envía /newbot')
  console.log('3. Dale un nombre al bot (ej: Evas Barcelona Bot)')
  console.log('4. Dale un username único (ej: evas_barcelona_bot)')
  console.log('5. Copia el token que te da BotFather')
  
  const botToken = await question('\n🔑 Pega aquí el token del bot: ')
  
  if (!botToken || botToken.length < 20) {
    console.log('❌ Token inválido. Saliendo...')
    rl.close()
    return
  }

  console.log('\n📋 Paso 2: Obtener tu Chat ID')
  console.log('1. Busca tu bot en Telegram (usando el username que creaste)')
  console.log('2. Envía /start al bot')
  console.log('3. Visita esta URL en tu navegador:')
  console.log(`   https://api.telegram.org/bot${botToken}/getUpdates`)
  console.log('4. Busca "chat":{"id": en la respuesta')
  console.log('5. Copia el número que aparece después de "id":')
  
  const chatId = await question('\n💬 Pega aquí tu Chat ID: ')
  
  if (!chatId || isNaN(chatId)) {
    console.log('❌ Chat ID inválido. Saliendo...')
    rl.close()
    return
  }

  console.log('\n🧪 Probando la configuración...')
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🎉 ¡Bot configurado correctamente!\n\nAhora recibirás notificaciones cuando se complete un cierre en Evas Barcelona.',
        parse_mode: 'Markdown'
      })
    })

    const result = await response.json()

    if (result.ok) {
      console.log('✅ ¡Mensaje de prueba enviado exitosamente!')
      console.log('\n📝 Variables de entorno para agregar:')
      console.log('=' .repeat(50))
      console.log(`TELEGRAM_BOT_TOKEN=${botToken}`)
      console.log(`TELEGRAM_CHAT_ID=${chatId}`)
      console.log('=' .repeat(50))
      
      console.log('\n🔧 Para agregar estas variables:')
      console.log('1. En Vercel: Settings → Environment Variables')
      console.log('2. En local: Agrega al archivo .env.local')
      
      console.log('\n🎯 Funcionalidades que recibirás:')
      console.log('• 📊 Resumen de ventas cuando se complete un cierre')
      console.log('• 👤 Información del trabajador y turno')
      console.log('• 📸 Conteo de fotos subidas')
      console.log('• 🕒 Fecha y hora del cierre')
      
    } else {
      console.log('❌ Error enviando mensaje de prueba:', result.description)
    }

  } catch (error) {
    console.log('❌ Error de conexión:', error.message)
  }

  rl.close()
}

// Verificar si fetch está disponible (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requiere Node.js 18+ o instalar node-fetch')
  console.log('   Instala con: npm install node-fetch')
  process.exit(1)
}

setupTelegram().catch(console.error)
