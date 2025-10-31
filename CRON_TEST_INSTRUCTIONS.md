# 🧪 Instrucciones para Prueba de Cron a las 2:35 AM

## ⚡ Configuración Rápida en Cron-Job.org

### Paso 1: Crear Cron de Prueba

1. Ve a [cron-job.org](https://cron-job.org)
2. Ve a "Cronjobs" → "Create Cronjob"
3. Configura:

   **URL:**
   ```
   https://TU-DOMINIO-VERCEL.vercel.app/api/weather/monitor
   ```
   *(Reemplaza TU-DOMINIO-VERCEL con tu dominio real de Vercel)*

   **Método:** `GET`

   **Horario (cron):**
   ```
   35 1 * * *
   ```
   *(Esto ejecuta a las 01:35 UTC = 02:35 AM hora Barcelona en invierno)*

   **Descripción:** "Prueba meteorológica 2:35 AM"

   **Opcional:** Activa "Execute once" si solo quieres que se ejecute una vez

4. Guarda el cron

### Paso 2: Verificar

- El cron se ejecutará automáticamente a las 2:35 AM hora de Barcelona
- Revisa tu grupo de Telegram `-5072283949` para ver el mensaje
- Puedes verificar los logs en cron-job.org después de la ejecución

### Paso 3: Eliminar después de la prueba

Una vez verificado que funciona, puedes eliminar este cron de prueba si quieres mantener solo los 3 crons permanentes.

---

## 📋 Nota sobre el horario

Si son las **2:28 AM** ahora y quieres probar a las **2:35 AM**:
- **Tiempo restante:** ~7 minutos
- **Horario UTC:** 01:35 (porque Barcelona está en UTC+1 en invierno)
- **Formato cron:** `35 1 * * *`

---

## ✅ Verificación

Después de las 2:35 AM, deberías recibir en Telegram:
- 📊 Datos meteorológicos de Barcelona
- 📱 Mensaje formateado con condiciones actuales
- ✅ Confirmation de que el sistema funciona en Vercel

