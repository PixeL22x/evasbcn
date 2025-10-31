# ⚡ Configuración Rápida - Sistema Meteorológico

## 📋 Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env` o `.env.local`:

```env
# ⚠️ OBLIGATORIAS
TELEGRAM_WEATHER_CHAT_ID=-5072283949

# ℹ️ Estas ya deberían estar configuradas (bot de Telegram)
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui

# ℹ️ Open-Meteo API - NO requiere API key (es gratis y funciona sin configuración)

# 📊 OPCIONALES (valores por defecto mostrados)
WEATHER_WIND_THRESHOLD=30      # km/h - viento fuerte
WEATHER_GUST_THRESHOLD=50      # km/h - ráfagas muy fuertes  
WEATHER_RAIN_THRESHOLD=2.0     # mm/h - lluvia fuerte
WEATHER_ALWAYS_NOTIFY=false    # true = enviar notificación siempre
```

## ✅ Open-Meteo API (Sin configuración necesaria)

**¡Buenas noticias!** El sistema usa **Open-Meteo API** que es:
- ✅ Completamente gratis
- ✅ Sin API key necesaria
- ✅ Funciona inmediatamente
- ✅ Sin límites estrictos

**No necesitas hacer nada más** - El sistema funciona automáticamente sin configuración adicional.

## ✅ Probar el Sistema

### 1. Generar cliente de Prisma (si no lo has hecho):

```bash
npx prisma generate
```

### 2. Reiniciar el servidor:

```bash
# Detén el servidor actual (Ctrl+C) y reinicia:
npm run dev
```

### 3. Probar manualmente:

```bash
# Desde el navegador:
http://localhost:3000/api/weather/monitor

# O desde terminal:
curl http://localhost:3000/api/weather/monitor
```

## ⏰ Configurar Monitoreo Automático (02:14 AM, 12 PM y 18 PM)

### Opción 1: Vercel Cron (si usas Vercel)

Agrega a `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/weather/monitor",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/weather/monitor",
      "schedule": "0 18 * * *"
    }
  ]
}
```

### Opción 2: Cron del Sistema (Linux/Mac)

```bash
crontab -e
```

Agrega:

```bash
0 12 * * * curl -X GET http://localhost:3000/api/weather/monitor >/dev/null 2>&1
0 18 * * * curl -X GET http://localhost:3000/api/weather/monitor >/dev/null 2>&1
```

### Opción 3: Servicio Externo (cron-job.org)

1. Ve a [cron-job.org](https://cron-job.org)
2. Crea 3 trabajos:
   - 02:14 AM: `https://tu-dominio.com/api/weather/monitor`
   - 12:00 PM: `https://tu-dominio.com/api/weather/monitor`
   - 18:00 PM: `https://tu-dominio.com/api/weather/monitor`

## 💡 Nota Importante

- **No se guarda nada en BD** - El historial se guarda automáticamente en el chat de Telegram
- **Siempre se envía** - Cada consulta se envía a Telegram (haya alerta o no) para mantener historial
- **Gratis** - El historial en Telegram es completamente gratis

## 📚 Documentación Completa

Ver `docs/WEATHER_MONITORING.md` para documentación completa.

## 🧪 Prueba Rápida

```bash
node scripts/test-weather-monitor.js
```
