/**
 * Servicio para consultar datos meteorológicos usando Open-Meteo (gratis, sin API key)
 * Coordenadas de Barcelona: 41.3851, 2.1734
 */

const BARCELONA_LAT = 41.3851
const BARCELONA_LON = 2.1734

// Umbrales para alertas del toldo (configurables)
const UMBRALES = {
  VIENTO_KMH: parseFloat(process.env.WEATHER_WIND_THRESHOLD) || 30, // km/h - viento fuerte
  RAFAGAS_KMH: parseFloat(process.env.WEATHER_GUST_THRESHOLD) || 50, // km/h - ráfagas muy fuertes
  LLUVIA_MMH: parseFloat(process.env.WEATHER_RAIN_THRESHOLD) || 2.0, // mm/h - lluvia fuerte
}

/**
 * Consulta los datos meteorológicos actuales de Barcelona usando Open-Meteo
 * @returns {Promise<Object>} Datos meteorológicos
 */
export async function getWeatherData() {
  try {
    // Open-Meteo API - Completamente gratis, sin API key necesaria
    // URL para condiciones actuales + pronóstico próximo (para obtener lluvia)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${BARCELONA_LAT}&longitude=${BARCELONA_LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,precipitation&hourly=precipitation&timezone=Europe%2FMadrid&forecast_days=1`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()

    // Open-Meteo devuelve los datos en un formato diferente
    const current = data.current || {}
    const hourly = data.hourly || {}
    
    // Convertir velocidad del viento de km/h (ya está en km/h en Open-Meteo)
    const velocidadViento = current.wind_speed_10m || 0
    const rafagasViento = current.wind_gusts_10m || null
    
    // Precipitación actual (mm/h) - Open-Meteo la da en mm
    // Usamos la precipitación de la hora actual si está disponible
    const lluvia = current.precipitation || 0
    
    // Código del tiempo para descripción
    const weatherCodes = {
      0: 'cielo despejado',
      1: 'mayormente despejado',
      2: 'parcialmente nublado',
      3: 'nublado',
      45: 'niebla',
      48: 'niebla con escarcha',
      51: 'llovizna ligera',
      53: 'llovizna moderada',
      55: 'llovizna intensa',
      56: 'llovizna helada ligera',
      57: 'llovizna helada intensa',
      61: 'lluvia ligera',
      63: 'lluvia moderada',
      65: 'lluvia intensa',
      66: 'lluvia helada ligera',
      67: 'lluvia helada intensa',
      71: 'nieve ligera',
      73: 'nieve moderada',
      75: 'nieve intensa',
      77: 'granos de nieve',
      80: 'chubascos ligeros',
      81: 'chubascos moderados',
      82: 'chubascos intensos',
      85: 'chubascos de nieve ligeros',
      86: 'chubascos de nieve intensos',
      95: 'tormenta eléctrica',
      96: 'tormenta con granizo ligero',
      99: 'tormenta con granizo intenso'
    }
    
    const weatherCode = current.weather_code || 0
    const descripcion = weatherCodes[weatherCode] || 'condiciones desconocidas'

    return {
      temperatura: current.temperature_2m || null,
      humedad: current.relative_humidity_2m || null,
      velocidadViento: Math.round(velocidadViento * 10) / 10, // Ya está en km/h
      rafagasViento: rafagasViento ? Math.round(rafagasViento * 10) / 10 : null,
      lluvia: Math.round(lluvia * 10) / 10, // mm/h
      descripcion: descripcion,
      icono: null, // Open-Meteo no proporciona iconos directamente
      presion: null, // No disponible en el endpoint actual
      visibilidad: null, // No disponible en el endpoint actual
      fechaConsulta: new Date(),
      raw: data // Datos completos por si se necesitan después
    }
  } catch (error) {
    console.error('Error consultando Open-Meteo:', error)
    throw error
  }
}

/**
 * Evalúa si las condiciones meteorológicas requieren cerrar el toldo
 * @param {Object} weatherData - Datos meteorológicos
 * @returns {Object} Evaluación con tipo de alerta y motivo
 */
export function evaluarCondicionesToldo(weatherData) {
  const alertas = []
  let requiereCerrar = false
  let motivo = null
  let tipo = 'monitoreo'

  // Verificar viento
  if (weatherData.velocidadViento >= UMBRALES.VIENTO_KMH) {
    requiereCerrar = true
    alertas.push(`⚠️ Viento fuerte: ${weatherData.velocidadViento} km/h (umbral: ${UMBRALES.VIENTO_KMH} km/h)`)
    
    if (!motivo) {
      motivo = `Viento fuerte de ${weatherData.velocidadViento} km/h`
      tipo = 'alerta_viento'
    }
  }

  // Verificar ráfagas (más peligrosas)
  if (weatherData.rafagasViento && weatherData.rafagasViento >= UMBRALES.RAFAGAS_KMH) {
    requiereCerrar = true
    alertas.push(`🌪️ Ráfagas muy fuertes: ${weatherData.rafagasViento} km/h (umbral: ${UMBRALES.RAFAGAS_KMH} km/h)`)
    
    if (!motivo || weatherData.rafagasViento > weatherData.velocidadViento) {
      motivo = `Ráfagas muy fuertes de ${weatherData.rafagasViento} km/h`
      tipo = 'alerta_viento'
    }
  }

  // Verificar lluvia
  if (weatherData.lluvia >= UMBRALES.LLUVIA_MMH) {
    requiereCerrar = true
    alertas.push(`🌧️ Lluvia fuerte: ${weatherData.lluvia} mm/h (umbral: ${UMBRALES.LLUVIA_MMH} mm/h)`)
    
    if (!motivo) {
      motivo = `Lluvia fuerte de ${weatherData.lluvia} mm/h`
      tipo = 'alerta_lluvia'
    }
  }

  return {
    requiereCerrarToldo: requiereCerrar,
    tipo: tipo,
    motivo: motivo || 'Condiciones normales',
    alertas: alertas,
    umbrales: UMBRALES
  }
}

/**
 * Obtiene un mensaje formateado para Telegram con los datos meteorológicos
 * @param {Object} weatherData - Datos meteorológicos
 * @param {Object} evaluacion - Resultado de la evaluación
 * @returns {String} Mensaje formateado para Telegram
 */
export function formatearMensajeTelegram(weatherData, evaluacion) {
  const ahora = new Date()
  const hora = ahora.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  })
  const fecha = ahora.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  })

  let mensaje = `🌤️ *MONITOREO METEOROLÓGICO - EVAS BARCELONA*\n\n`
  
  mensaje += `📅 *Fecha:* ${fecha}\n`
  mensaje += `🕐 *Hora:* ${hora}\n\n`
  
  // Condiciones actuales
  mensaje += `*📊 CONDICIONES ACTUALES:*\n`
  mensaje += `🌡️ Temperatura: ${weatherData.temperatura ? `${weatherData.temperatura}°C` : 'N/A'}\n`
  mensaje += `💨 Viento: ${weatherData.velocidadViento} km/h`
  
  if (weatherData.rafagasViento) {
    mensaje += ` (ráfagas: ${weatherData.rafagasViento} km/h)`
  }
  mensaje += `\n`
  
  mensaje += `🌧️ Lluvia: ${weatherData.lluvia} mm/h\n`
  mensaje += `💧 Humedad: ${weatherData.humedad ? `${weatherData.humedad}%` : 'N/A'}\n`
  
  if (weatherData.descripcion) {
    mensaje += `☁️ Estado: ${weatherData.descripcion.charAt(0).toUpperCase() + weatherData.descripcion.slice(1)}\n`
  }
  
  mensaje += `\n`

  // Estado del toldo
  mensaje += `\n`
  if (evaluacion.requiereCerrarToldo) {
    mensaje += `🚨 *⚠️ ALERTA: CERRAR TOLDO* ⚠️\n\n`
    mensaje += `*Motivo:* ${evaluacion.motivo}\n\n`
    
    if (evaluacion.alertas.length > 0) {
      mensaje += `*Condiciones peligrosas detectadas:*\n`
      evaluacion.alertas.forEach(alerta => {
        mensaje += `${alerta}\n`
      })
    }
    
    mensaje += `\n✅ *ACCIÓN REQUERIDA:* Cerrar el toldo inmediatamente por seguridad.\n`
  } else {
    mensaje += `✅ *Estado del toldo:* Condiciones normales, el toldo puede permanecer abierto.\n`
  }

  return mensaje.trim()
}

export { UMBRALES }
