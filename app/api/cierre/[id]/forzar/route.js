import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function sendTelegramNotification(cierre) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return { sent: false, reason: 'no_config' }

    // Verificar si el bot está habilitado
    try {
        const config = await prisma.configuracion.findUnique({ where: { clave: 'telegram_bot_enabled' } })
        if (config?.valor?.enabled === false) return { sent: false, reason: 'disabled' }
    } catch (_) { }

    const fecha = cierre.fechaFin ? new Date(cierre.fechaFin) : new Date()
    const mensaje = `
⚡ *CIERRE FORZADO POR ADMIN*

👤 *Trabajador:* ${cierre.trabajador}
🕐 *Turno:* ${cierre.turno}
💰 *Ventas Totales:* €${cierre.totalVentas ?? '—'}

📅 *Fecha:* ${fecha.toLocaleDateString('es-ES')}
🕒 *Hora cierre forzado:* ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}

⚠️ *Este cierre fue completado manualmente por el administrador.*
    `.trim()

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: mensaje,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        })
    })

    return { sent: res.ok }
}

export async function POST(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json().catch(() => ({}))
        const { totalVentas, enviarTelegram = true } = body

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        }

        // Obtener el cierre actual
        const cierreActual = await prisma.cierre.findUnique({
            where: { id },
            include: { tareas: true }
        })

        if (!cierreActual) {
            return NextResponse.json({ error: 'Cierre no encontrado' }, { status: 404 })
        }

        if (cierreActual.completado) {
            return NextResponse.json({ error: 'El cierre ya está completado' }, { status: 400 })
        }

        // Preparar datos de actualización
        const updateData = {
            completado: true,
            fechaFin: cierreActual.fechaFin ?? new Date(),
        }

        if (totalVentas !== undefined && totalVentas !== null && totalVentas !== '') {
            updateData.totalVentas = parseFloat(totalVentas)
        }

        // Actualizar el cierre
        const cierreActualizado = await prisma.cierre.update({
            where: { id },
            data: updateData,
            include: { tareas: true }
        })

        // Enviar Telegram si se solicitó
        let telegramResult = { sent: false }
        if (enviarTelegram) {
            telegramResult = await sendTelegramNotification(cierreActualizado)
        }

        console.log(`⚡ Cierre ${id} forzado por admin. Telegram: ${telegramResult.sent}`)

        return NextResponse.json({
            cierre: cierreActualizado,
            telegramSent: telegramResult.sent,
            message: 'Cierre forzado correctamente'
        })

    } catch (error) {
        console.error('Error al forzar cierre:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
