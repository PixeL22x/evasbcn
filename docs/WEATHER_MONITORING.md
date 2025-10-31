# 🌤️ Sistema de Monitoreo Meteorológico - Evas Barcelona

Sistema automático de alertas meteorológicas para proteger el toldo de la tienda en Barcelona.

## 🎯 Funcionalidad

El sistema monitorea las condiciones meteorológicas **3 veces al día** (02:20 AM, 12:00 PM y 18:00 PM) y envía alertas por Telegram cuando detecta condiciones peligrosas que requieren cerrar el toldo:

- **Viento fuerte**: > 30 km/h (configurable)
- **Ráfagas muy fuertes**: > 50 km/h (configurable)
- **Lluvia fuerte**: > 2 mm/h (configurable)

## 📋 Requisitos Previos

### 1. Open-Meteo API (Gratis, sin API key)

**No requiere configuración!** Open-Meteo es completamente gratis, sin API key necesaria y funciona inmediatamente. Proporciona datos meteorológicos precisos para Barcelona.

- ✅ Completamente gratis
- ✅ Sin API key necesaria
- ✅ Funciona inmediatamente
- ✅ Sin límites estrictos
- ✅ Código abierto

### 2. Bot de Telegram Configurado

- Debes tener un bot de Telegram ya configurado (ver `TELEGRAM_BOT.md`)
- Necesitarás el **Chat ID del grupo** donde quieres recibir las alertas meteorológicas
- Este chat ID es diferente del chat de ventas

## 🔧 Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env` o `.env.local`:

```env
# Open-Meteo API - NO requiere API key (es gratis y funciona sin configuración)

# Telegram (bot ya configurado)
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui

# Chat ID específico para alertas meteorológicas (GRUPO)
TELEGRAM_WEATHER_CHAT_ID=-5072283949

# Umbrales configurables (opcionales, valores por defecto mostrados)
WEATHER_WIND_THRESHOLD=30      # km/h - viento fuerte
WEATHER_GUST_THRESHOLD=50      # km/h - ráfagas muy fuertes
WEATHER_RAIN_THRESHOLD=2.0     # mm/h - lluvia fuerte

# Opcional: enviar notificación siempre (incluso si no hay alerta)
WEATHER_ALWAYS_NOTIFY=false   # true/false
```

### Ubicación

El sistema está configurado para **Barcelona**:
- Latitud: 41.3851
- Longitud: 2.1734

Si necesitas cambiar la ubicación, edita `lib/weather.js`.

## 🚀 Uso

### Monitoreo Manual

Puedes probar el sistema manualmente haciendo una petición:

```bash
# GET o POST
curl http://localhost:3000/api/weather/monitor
```

O desde el navegador:
```
http://localhost:3000/api/weather/monitor
```

### Monitoreo Automático (Cron)

Para ejecutar automáticamente a las **12:00 PM** y **18:00 PM**, puedes usar:

#### Opción 1: Cron-Job.org (Recomendado - Gratis)

**Solución recomendada**: Usar [cron-job.org](https://cron-job.org) que es completamente gratuito y sin límites estrictos.

**Pasos para configurar:**

1. Ve a [cron-job.org](https://cron-job.org) y crea una cuenta gratuita
2. Crea **3 trabajos cron** con estos horarios:

   **Trabajo 1 - 02:20 AM (hora de Barcelona, horario de invierno UTC+1):**
   - URL: `https://tu-dominio.vercel.app/api/weather/monitor`
   - Método: `GET`
   - Horario: `20 1 * * *` (01:20 UTC = 02:20 AM hora Barcelona en invierno)
   - Descripción: "Monitoreo meteorológico 02:20 AM"

   **Trabajo 2 - 12:00 PM (hora de Barcelona, horario de invierno UTC+1):**
   - URL: `https://tu-dominio.vercel.app/api/weather/monitor`
   - Método: `GET`
   - Horario: `0 11 * * *` (11:00 UTC = 12:00 PM hora Barcelona en invierno)
   - Descripción: "Monitoreo meteorológico 12:00 PM"

   **Trabajo 3 - 18:00 PM (hora de Barcelona, horario de invierno UTC+1):**
   - URL: `https://tu-dominio.vercel.app/api/weather/monitor`
   - Método: `GET`
   - Horario: `0 17 * * *` (17:00 UTC = 18:00 PM hora Barcelona en invierno)
   - Descripción: "Monitoreo meteorológico 18:00 PM"

**Nota**: Ajusta los horarios UTC según la estación:
- **Horario de invierno (UTC+1)**: Resta 1 hora → 01:20, 11:00, 17:00 UTC
- **Horario de verano (UTC+2)**: Resta 2 horas → 00:20, 10:00, 16:00 UTC

**Ventajas de cron-job.org:**
- ✅ Completamente gratis
- ✅ Sin límites estrictos
- ✅ Funciona con cualquier dominio
- ✅ Configuración simple y visual
- ✅ Logs de ejecución disponibles

#### Opción 2: Cron del Sistema (Linux/Mac)

Agrega al crontab (`crontab -e`):

```bash
# Monitoreo meteorológico a las 02:20 AM, 12:00 PM y 18:00 PM (hora de Barcelona)
20 2 * * * curl -X GET http://localhost:3000/api/weather/monitor >/dev/null 2>&1
0 12 * * * curl -X GET http://localhost:3000/api/weather/monitor >/dev/null 2>&1
0 18 * * * curl -X GET http://localhost:3000/api/weather/monitor >/dev/null 2>&1
```

**Nota**: Ajusta la URL si tu servidor está en otra dirección.

#### Opción 3: Windows Task Scheduler

1. Abre "Programador de tareas" en Windows
2. Crea **3 tareas básicas** para:
   - **02:20 AM**: Ejecutar `curl http://localhost:3000/api/weather/monitor`
   - **12:00 PM**: Ejecutar `curl http://localhost:3000/api/weather/monitor`
   - **18:00 PM**: Ejecutar `curl http://localhost:3000/api/weather/monitor`

## 📊 Respuesta de la API

### Ejemplo de respuesta exitosa:

```json
{
  "success": true,
  "message": "Monitoreo meteorológico completado",
  "data": {
    "weather": {
      "temperatura": 22.5,
      "velocidadViento": 15.3,
      "rafagasViento": 25.7,
      "lluvia": 0.0,
      "humedad": 65,
      "descripcion": "cielo despejado"
    },
    "evaluacion": {
      "requiereCerrarToldo": false,
      "tipo": "monitoreo",
      "motivo": "Condiciones normales",
      "alertas": []
    },
    "telegramEnviado": false,
    "fecha": "2024-01-15T12:00:00.000Z"
  }
}
```

### Ejemplo con alerta:

```json
{
  "success": true,
  "message": "Monitoreo meteorológico completado",
  "data": {
    "weather": {
      "temperatura": 18.2,
      "velocidadViento": 35.5,
      "rafagasViento": 52.3,
      "lluvia": 3.2,
      "humedad": 80,
      "descripcion": "lluvia moderada"
    },
    "evaluacion": {
      "requiereCerrarToldo": true,
      "tipo": "alerta_viento",
      "motivo": "Ráfagas muy fuertes de 52.3 km/h",
      "alertas": [
        "🌪️ Ráfagas muy fuertes: 52.3 km/h (umbral: 50 km/h)",
        "🌧️ Lluvia fuerte: 3.2 mm/h (umbral: 2 mm/h)"
      ]
    },
    "telegramEnviado": true,
    "fecha": "2024-01-15T18:00:00.000Z"
  }
}
```

## 📱 Mensajes de Telegram

### Mensaje cuando hay alerta:

```
🌤️ MONITOREO METEOROLÓGICO - EVAS BARCELONA

📅 Fecha: 15/01/2024
🕐 Hora: 18:00

📊 CONDICIONES ACTUALES:
🌡️ Temperatura: 18.2°C
💨 Viento: 35.5 km/h (ráfagas: 52.3 km/h)
🌧️ Lluvia: 3.2 mm/h
💧 Humedad: 80%
☁️ Estado: Lluvia moderada

🚨 ⚠️ ALERTA: CERRAR TOLDO ⚠️

Motivo: Ráfagas muy fuertes de 52.3 km/h

Condiciones peligrosas detectadas:
🌪️ Ráfagas muy fuertes: 52.3 km/h (umbral: 50 km/h)
🌧️ Lluvia fuerte: 3.2 mm/h (umbral: 2 mm/h)

✅ ACCIÓN REQUERIDA: Cerrar el toldo inmediatamente por seguridad.
```

### Mensaje cuando no hay alerta:

```
🌤️ MONITOREO METEOROLÓGICO - EVAS BARCELONA

📅 Fecha: 15/01/2024
🕐 Hora: 12:00

📊 CONDICIONES ACTUALES:
🌡️ Temperatura: 22.5°C
💨 Viento: 15.3 km/h
🌧️ Lluvia: 0.0 mm/h
💧 Humedad: 65%
☁️ Estado: Cielo despejado

✅ Estado del toldo: Condiciones normales, el toldo puede permanecer abierto.
```

## 💾 Historial

**El historial se guarda automáticamente en el chat de Telegram** (gratis). Todas las consultas meteorológicas se envían al grupo configurado, tanto si hay alerta como si no, para mantener un registro completo.

No se guarda nada en la base de datos para no sobrecargarla.

## 🔍 Troubleshooting

### Error: "OPENWEATHERMAP_API_KEY no configurada"
- Verifica que la variable de entorno esté en `.env` o `.env.local`
- Reinicia el servidor después de agregar la variable

### Error: "TELEGRAM_WEATHER_CHAT_ID no configurado"
- Verifica que el Chat ID esté configurado
- El Chat ID debe ser del formato: `-5072283949` (con el guion si es grupo)

### No se reciben mensajes en Telegram
1. Verifica que el bot esté en el grupo
2. Verifica que el Chat ID sea correcto (debe ser negativo para grupos)
3. Verifica que `TELEGRAM_BOT_TOKEN` esté configurado
4. Revisa los logs del servidor para ver errores

### El endpoint no responde
1. Verifica que el servidor esté corriendo
2. Verifica que OpenWeatherMap API esté disponible
3. Revisa los logs para ver errores específicos

### Cron no se ejecuta
1. Verifica que el cron esté configurado con la hora correcta (hora de Barcelona)
2. Verifica que la URL sea accesible desde donde se ejecuta el cron
3. Si usas cron local, verifica los logs del sistema

## 📈 Futuras Mejoras

- [ ] Dashboard visual con historial de alertas
- [ ] Gráficos de tendencias meteorológicas
- [ ] Notificaciones push adicionales
- [ ] Integración con sensores físicos
- [ ] Configuración de umbrales desde el panel admin
- [ ] Alertas tempranas (previsión para próximas horas)

## 🔒 Seguridad

- La API Key de OpenWeatherMap debe mantenerse privada
- Los datos meteorológicos se almacenan localmente en tu BD
- Las notificaciones solo se envían al Chat ID configurado

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Prueba el endpoint manualmente primero
4. Consulta la documentación de [OpenWeatherMap API](https://openweathermap.org/api)
