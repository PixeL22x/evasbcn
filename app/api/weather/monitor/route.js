import { NextResponse } from 'next/server'
import { getWeatherData, evaluarCondicionesToldo, formatearMensajeTelegram } from '../../../../lib/weather'

/**
 * Endpoint para monitoreo meteorológico
 * Se debe llamar a las 12:00 PM y 18:00 PM
 * 
 * No guarda en BD, solo consulta y envía a Telegram
 * El historial se guarda en el chat de Telegram
 * 
 * GET /api/weather/monitor - Realiza monitoreo meteorológico
 * 
 * Este endpoint es público y puede ser llamado desde cron-job.org
 * Configurado para evitar caché y autenticación de Vercel
 */

// Configurar el route handler para evitar caché y autenticación
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request) {
  try {
    console.log('🌤️ Iniciando monitoreo meteorológico...')
    
    // Log del origen de la petición para debugging
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown'
    console.log('📡 Petición recibida desde:', { userAgent, origin })
    
    // Opcional: Verificar si viene de cron-job.org (opcional, solo para logging)
    const isFromCronJob = userAgent.includes('cron-job') || origin.includes('cron-job')
    if (isFromCronJob) {
      console.log('✅ Petición recibida de cron-job.org')
    }

    // 1. Consultar datos meteorológicos
    let weatherData
    try {
      weatherData = await getWeatherData()
      console.log('✅ Datos meteorológicos obtenidos:', {
        temperatura: weatherData.temperatura,
        viento: weatherData.velocidadViento,
        lluvia: weatherData.lluvia
      })
    } catch (error) {
      console.error('❌ Error obteniendo datos meteorológicos:', error)
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo datos meteorológicos',
        message: error.message
      }, { status: 500 })
    }

    // 2. Evaluar condiciones para el toldo
    const evaluacion = evaluarCondicionesToldo(weatherData)
    console.log('📊 Evaluación de condiciones:', {
      requiereCerrar: evaluacion.requiereCerrarToldo,
      tipo: evaluacion.tipo,
      motivo: evaluacion.motivo
    })

    // 3. Enviar notificación a Telegram (siempre se envía para guardar historial)
    let telegramEnviado = false
    let telegramError = null
    
    try {
      const mensaje = formatearMensajeTelegram(weatherData, evaluacion)
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      const weatherChatId = process.env.TELEGRAM_WEATHER_CHAT_ID // Chat específico para alertas meteorológicas
      
      if (!botToken) {
        telegramError = 'TELEGRAM_BOT_TOKEN no configurado'
        console.warn('⚠️', telegramError)
      } else if (!weatherChatId) {
        telegramError = 'TELEGRAM_WEATHER_CHAT_ID no configurado'
        console.warn('⚠️', telegramError)
      } else {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: weatherChatId,
            text: mensaje,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        })

        const result = await telegramResponse.json()

        if (result.ok) {
          telegramEnviado = true
          console.log('✅ Información meteorológica enviada a Telegram')
        } else {
          telegramError = result.description || 'Error desconocido'
          console.error('❌ Error enviando a Telegram:', telegramError)
        }
      }
    } catch (error) {
      telegramError = error.message
      console.error('❌ Error enviando notificación a Telegram:', error)
      // No fallar la operación completa si Telegram falla
    }

    // 4. Retornar respuesta con headers CORS para permitir peticiones externas
    const response = NextResponse.json({
      success: true,
      message: 'Monitoreo meteorológico completado',
      data: {
        weather: {
          temperatura: weatherData.temperatura,
          velocidadViento: weatherData.velocidadViento,
          rafagasViento: weatherData.rafagasViento,
          lluvia: weatherData.lluvia,
          humedad: weatherData.humedad,
          descripcion: weatherData.descripcion
        },
        evaluacion: {
          requiereCerrarToldo: evaluacion.requiereCerrarToldo,
          tipo: evaluacion.tipo,
          motivo: evaluacion.motivo,
          alertas: evaluacion.alertas
        },
        telegramEnviado: telegramEnviado,
        telegramError: telegramError || null,
        fecha: new Date().toISOString()
      }
    })
    
    // Headers CORS para permitir peticiones desde cron-job.org
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    // Headers para evitar caché en Vercel
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    
    return response

  } catch (error) {
    console.error('❌ Error en monitoreo meteorológico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * POST /api/weather/monitor - También permite llamar por POST
 */
export async function POST(request) {
  return GET(request)
}

/**
 * OPTIONS /api/weather/monitor - Manejar preflight CORS
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
