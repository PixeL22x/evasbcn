# 🤖 Bot de Telegram para Evas Barcelona

Sistema de notificaciones automáticas para recibir información de ventas y cierres en tiempo real.

## 🚀 Funcionalidades

### 📊 Notificaciones Automáticas
- **Cierre completado**: Resumen cuando se termina un turno
- **Información incluida**:
  - 👤 Trabajador y turno
  - 💰 Ventas totales del día
  - 📊 Comparativa en porcentaje con el día anterior
  - 📅 Fecha y hora del cierre

### 📈 Estadísticas por Demanda
- Envío de estadísticas filtradas por fecha, trabajador o turno
- Resumen de ventas y rendimiento
- Lista de cierres recientes

## 🔧 Configuración

### Paso 1: Crear el Bot
1. Abre Telegram y busca `@BotFather`
2. Envía `/newbot`
3. Dale un nombre: `Evas Barcelona Bot`
4. Dale un username único: `evas_barcelona_bot`
5. Copia el **token** que te da BotFather

### Paso 2: Obtener Chat ID
1. Busca tu bot en Telegram (usando el username)
2. Envía `/start` al bot
3. Visita: `https://api.telegram.org/bot[TU_TOKEN]/getUpdates`
4. Busca `"chat":{"id":` en la respuesta
5. Copia el **número** que aparece después de `"id":`

### Paso 3: Configurar Variables de Entorno

#### En Vercel (Producción):
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   ```
   TELEGRAM_BOT_TOKEN=tu_token_aqui
   TELEGRAM_CHAT_ID=tu_chat_id_aqui
   ```

#### En Local (.env.local):
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui
```

## 🛠️ Script de Configuración Automática

Ejecuta el script para configurar automáticamente:

```bash
node scripts/setup-telegram.js
```

Este script te guiará paso a paso para:
- Crear el bot
- Obtener el Chat ID
- Probar la configuración
- Mostrar las variables de entorno

## 📱 Uso

### Notificaciones Automáticas
Las notificaciones se envían automáticamente cuando:
- Se completa un cierre (todas las tareas terminadas)
- Se sube una foto importante

### Envío Manual de Estadísticas
1. Ve a la sección de Estadísticas en la app
2. Aplica filtros si es necesario
3. Haz clic en "📤 Enviar a Telegram"

### Endpoints de API

#### Verificar configuración:
```
GET /api/telegram/config
```

#### Enviar mensaje de prueba:
```
POST /api/telegram/config
{
  "message": "Mensaje de prueba"
}
```

#### Obtener estadísticas:
```
GET /api/estadisticas?fecha=2024-01-15&trabajador=Piero&turno=tarde
```

#### Enviar estadísticas a Telegram:
```
POST /api/estadisticas
{
  "fecha": "2024-01-15",
  "trabajador": "Piero",
  "turno": "tarde"
}
```

## 🔍 Troubleshooting

### Bot no responde
1. Verifica que el token sea correcto
2. Asegúrate de haber enviado `/start` al bot
3. Revisa que el Chat ID sea correcto

### Variables no se cargan
1. En Vercel: Verifica que las variables estén en "Production"
2. En local: Reinicia el servidor después de agregar variables
3. Usa `/api/debug/env-check` para verificar

### Mensajes no llegan
1. Verifica que el bot esté activo
2. Revisa los logs del servidor
3. Prueba enviando un mensaje manual desde `/api/telegram/config`

## 📋 Ejemplo de Mensaje

```
🎉 CIERRE COMPLETADO

👤 Trabajador: Piero
🕐 Turno: tarde
💰 Ventas Totales: €245.50

📊 Comparativa con día anterior:
📈 +15% vs ayer (€213.00)

📅 Fecha: 15/01/2024
🕒 Hora: 22:30:15

✅ Estado: Cierre completado exitosamente
```

## 🔒 Seguridad

- El token del bot es sensible, no lo compartas
- Las variables de entorno están protegidas en Vercel
- Los mensajes solo van a tu Chat ID específico

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración con `/api/telegram/config`
3. Prueba el script de configuración automática
4. Contacta al desarrollador con los logs de error
