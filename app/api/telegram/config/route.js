import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken) {
      return NextResponse.json({
        configured: false,
        message: 'Bot token no configurado',
        instructions: [
          '1. Crea un bot en Telegram hablando con @BotFather',
          '2. Obtén el token del bot',
          '3. Agrega TELEGRAM_BOT_TOKEN a las variables de entorno',
          '4. Obtén tu chat ID enviando /start al bot',
          '5. Agrega TELEGRAM_CHAT_ID a las variables de entorno'
        ]
      })
    }

    if (!chatId) {
      return NextResponse.json({
        configured: false,
        message: 'Chat ID no configurado',
        instructions: [
          '1. Envía /start a tu bot en Telegram',
          '2. Visita: https://api.telegram.org/bot' + botToken + '/getUpdates',
          '3. Busca el "chat":{"id": en la respuesta',
          '4. Agrega TELEGRAM_CHAT_ID a las variables de entorno'
        ]
      })
    }

    // Probar conexión con el bot
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
      const botInfo = await response.json()

      if (!botInfo.ok) {
        throw new Error('Token inválido')
      }

      return NextResponse.json({
        configured: true,
        botInfo: {
          username: botInfo.result.username,
          firstName: botInfo.result.first_name,
          canJoinGroups: botInfo.result.can_join_groups,
          canReadAllGroupMessages: botInfo.result.can_read_all_group_messages
        },
        chatId: chatId,
        message: 'Bot configurado correctamente'
      })

    } catch (error) {
      return NextResponse.json({
        configured: false,
        message: 'Error conectando con el bot',
        error: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error verificando configuración de Telegram:', error)
    return NextResponse.json({
      configured: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { message } = await request.json()

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      return NextResponse.json({
        success: false,
        message: 'Bot no configurado correctamente'
      }, { status: 400 })
    }

    // Enviar mensaje de prueba
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message || '🧪 Mensaje de prueba desde la aplicación',
        parse_mode: 'Markdown'
      })
    })

    const result = await response.json()

    if (!result.ok) {
      throw new Error(result.description || 'Error enviando mensaje')
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      messageId: result.result.message_id
    })

  } catch (error) {
    console.error('Error enviando mensaje de prueba:', error)
    return NextResponse.json({
      success: false,
      message: 'Error enviando mensaje',
      error: error.message
    }, { status: 500 })
  }
}
