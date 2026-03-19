/**
 * lib/telegram.js — Utilidad compartida para enviar mensajes de Telegram
 * Llamar directamente desde otros API routes sin hacer fetch interno
 */

// Bot principal (cierres y notificaciones generales)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// Bot dedicado a tareas asignadas
const TELEGRAM_TAREAS_BOT_TOKEN = process.env.TELEGRAM_TAREAS_BOT_TOKEN
const TELEGRAM_TAREAS_CHAT_ID = process.env.TELEGRAM_TAREAS_CHAT_ID

/**
 * Envía un mensaje al grupo principal (bot de cierres)
 */
export async function sendTelegramMessage(message) {
    return _send(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message)
}

/**
 * Envía un mensaje al grupo de tareas asignadas (bot dedicado)
 */
export async function sendTareasTelegramMessage(message) {
    return _send(TELEGRAM_TAREAS_BOT_TOKEN, TELEGRAM_TAREAS_CHAT_ID, message)
}

/**
 * Función interna: envía un mensaje a cualquier bot/chat
 */
async function _send(botToken, chatId, message) {
    if (!botToken || !chatId) {
        console.log('⚠️ Credenciales de Telegram no configuradas')
        return { ok: false, error: 'No configurado' }
    }

    try {
        const res = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            }
        )

        if (!res.ok) {
            const err = await res.json()
            console.error('❌ Error Telegram:', err)
            return { ok: false, error: err.description ?? 'Error Telegram' }
        }

        return { ok: true }
    } catch (err) {
        console.error('❌ Error enviando a Telegram:', err)
        return { ok: false, error: err.message }
    }
}
