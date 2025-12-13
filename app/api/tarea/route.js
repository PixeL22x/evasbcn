import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// Actualizar una tarea
export async function PUT(request) {
  try {
    const { tareaId, completada, cierreId } = await request.json()

    if (!tareaId) {
      return NextResponse.json(
        { error: 'ID de tarea es requerido' },
        { status: 400 }
      )
    }

    // Actualizar la tarea
    const tarea = await prisma.tarea.update({
      where: { id: tareaId },
      data: { completada },
    })

    // Si se completó la tarea, verificar si todas las tareas del cierre están completadas
    if (completada && cierreId) {
      const cierre = await prisma.cierre.findUnique({
        where: { id: cierreId },
        include: { tareas: true },
      })

      if (cierre) {
        const todasCompletadas = cierre.tareas.every(t => t.completada)

        if (todasCompletadas) {
          // Marcar el cierre como completado y establecer fecha de fin
          const cierreActualizado = await prisma.cierre.update({
            where: { id: cierreId },
            data: {
              completado: true,
              fechaFin: new Date(),
            },
          })

          // Enviar notificación simple a Telegram
          try {
            // Obtener hora de Barcelona
            const fechaBarcelona = new Date(cierreActualizado.fechaFin).toLocaleString('es-ES', {
              timeZone: 'Europe/Madrid',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })

            const [fecha, hora] = fechaBarcelona.split(', ')

            const mensaje = `
🎉 *CIERRE COMPLETADO*

👤 *Trabajador:* ${cierreActualizado.trabajador}
🕐 *Turno:* ${cierreActualizado.turno}
💰 *Ventas Totales:* €${cierreActualizado.totalVentas || 0}
📅 *Fecha:* ${fecha}
🕒 *Hora:* ${hora}
            `.trim()

            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
            const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
              const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: TELEGRAM_CHAT_ID,
                  text: mensaje,
                  parse_mode: 'Markdown',
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: '📊 Ver Detalles',
                          url: `${process.env.NEXTAUTH_URL}/admin/cierres`
                        }
                      ]
                    ]
                  }
                }),
              })

              if (response.ok) {
                console.log('✅ Notificación de cierre enviada a Telegram')
              } else {
                console.error('⚠️ Error enviando notificación a Telegram:', await response.text())
              }
            } else {
              console.log('⚠️ Telegram no configurado - saltando notificación')
            }
          } catch (telegramError) {
            console.error('⚠️ Error enviando notificación a Telegram:', telegramError)
            // No fallar la operación principal por un error de Telegram
          }
        }
      }
    }

    return NextResponse.json({ tarea })
  } catch (error) {
    console.error('Error al actualizar tarea:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
