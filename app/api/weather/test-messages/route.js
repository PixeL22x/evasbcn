import { NextResponse } from 'next/server'
import { formatearMensajeTelegram } from '../../../../lib/weather'

/**
 * Endpoint de prueba para enviar mensajes de ejemplo a Telegram
 * Envía dos mensajes: uno con alerta y uno sin alerta
 * 
 * GET /api/weather/test-messages - Envía mensajes de prueba a Telegram
 */

export async function GET(request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const weatherChatId = process.env.TELEGRAM_WEATHER_CHAT_ID

    if (!botToken || !weatherChatId) {
      return NextResponse.json({
        success: false,
        error: 'Telegram no configurado',
        message: 'Verifica que TELEGRAM_BOT_TOKEN y TELEGRAM_WEATHER_CHAT_ID estén configurados'
      }, { status: 400 })
    }

    const resultados = []

    // Mensaje 1: CON ALERTA (viento fuerte)
    const weatherDataAlerta = {
      temperatura: 18,
      humedad: 75,
      velocidadViento: 32,
      rafagasViento: 38,
      lluvia: 0,
      descripcion: 'nublado',
      fechaConsulta: new Date()
    }

    const evaluacionAlerta = {
      requiereCerrarToldo: true,
      tipo: 'alerta_viento',
      motivo: 'Viento fuerte de 32 km/h',
      alertas: ['Viento: 32 km/h', 'Ráfagas: 38 km/h'],
      umbrales: { VIENTO_KMH: 28, RAFAGAS_KMH: 30, LLUVIA_MMH: 1.0 }
    }

    const mensajeAlerta = formatearMensajeTelegram(weatherDataAlerta, evaluacionAlerta)

    try {
      const response1 = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: weatherChatId,
          text: mensajeAlerta,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      })

      const result1 = await response1.json()
      resultados.push({
        tipo: 'alerta',
        exito: result1.ok,
        mensaje: result1.ok ? 'Mensaje con alerta enviado' : result1.description
      })
    } catch (error) {
      resultados.push({
        tipo: 'alerta',
        exito: false,
        error: error.message
      })
    }

    // Esperar 2 segundos antes de enviar el segundo mensaje
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mensaje 2: SIN ALERTA (condiciones normales)
    const weatherDataNormal = {
      temperatura: 20,
      humedad: 60,
      velocidadViento: 15,
      rafagasViento: 18,
      lluvia: 0,
      descripcion: 'mayormente despejado',
      fechaConsulta: new Date()
    }

    const evaluacionNormal = {
      requiereCerrarToldo: false,
      tipo: 'monitoreo',
      motivo: 'Condiciones normales',
      alertas: [],
      umbrales: { VIENTO_KMH: 28, RAFAGAS_KMH: 30, LLUVIA_MMH: 1.0 }
    }

    const mensajeNormal = formatearMensajeTelegram(weatherDataNormal, evaluacionNormal)

    try {
      const response2 = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: weatherChatId,
          text: mensajeNormal,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      })

      const result2 = await response2.json()
      resultados.push({
        tipo: 'normal',
        exito: result2.ok,
        mensaje: result2.ok ? 'Mensaje normal enviado' : result2.description
      })
    } catch (error) {
      resultados.push({
        tipo: 'normal',
        exito: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Mensajes de prueba enviados',
      resultados: resultados,
      mensajes: {
        alerta: mensajeAlerta,
        normal: mensajeNormal
      }
    })

  } catch (error) {
    console.error('Error en test de mensajes:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      message: error.message
    }, { status: 500 })
  }
}

