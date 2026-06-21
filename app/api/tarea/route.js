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

    // Verificar que la tarea existe antes de actualizar
    const tareaExistente = await prisma.tarea.findUnique({
      where: { id: tareaId }
    })

    if (!tareaExistente) {
      console.warn(`⚠️ Intento de actualizar tarea inexistente: ${tareaId}`)
      return NextResponse.json(
        { error: 'Tarea no encontrada. Es posible que esta sesión sea antigua y las tareas ya no existan.' },
        { status: 404 }
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

          // Enviar notificación a Telegram
          try {
            const fechaFin = new Date(cierreActualizado.fechaFin)
            const hora = fechaFin.toLocaleTimeString('es-ES', {
              timeZone: 'Europe/Madrid',
              hour: '2-digit',
              minute: '2-digit'
            })
            const fecha = fechaFin.toLocaleDateString('es-ES', {
              timeZone: 'Europe/Madrid',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })

            const turnoLabel = cierreActualizado.turno.charAt(0).toUpperCase() + cierreActualizado.turno.slice(1)
            const ventasStr = cierreActualizado.totalVentas != null
              ? `€${Number(cierreActualizado.totalVentas).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'

            // Siguiente turno (solo aplica al cierre de mañana → quién entra de tarde ese día)
            let siguienteTurnoLine = ''
            if (cierreActualizado.turno === 'mañana') {
              try {
                const hoy = new Date(cierreActualizado.fechaFin)
                // Inicio y fin del día en UTC para ExcepcionHorario
                const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
                const finDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1))
                const diaSemana = hoy.getDay() // 0=Dom … 6=Sáb

                // Buscar excepción puntual para hoy con turno T
                const excepcion = await prisma.excepcionHorario.findFirst({
                  where: {
                    turno: 'T',
                    fecha: { gte: inicioDia, lt: finDia }
                  },
                  include: { trabajador: { select: { nombre: true, activo: true } } }
                })

                if (excepcion?.trabajador?.activo) {
                  siguienteTurnoLine = `\n➡️ Siguiente: <b>${excepcion.trabajador.nombre}</b> (tarde)`
                } else {
                  // Sin excepción → buscar por regla semanal
                  const regla = await prisma.reglaHorario.findFirst({
                    where: { diaSemana, turno: 'T' },
                    include: { trabajador: { select: { nombre: true, activo: true } } }
                  })
                  // Verificar que no tenga excepción de ese día que lo anule
                  if (regla?.trabajador?.activo) {
                    const anulada = await prisma.excepcionHorario.findFirst({
                      where: {
                        trabajadorId: regla.trabajadorId,
                        fecha: { gte: inicioDia, lt: finDia }
                      }
                    })
                    if (!anulada) {
                      siguienteTurnoLine = `\n➡️ Siguiente: <b>${regla.trabajador.nombre}</b> (tarde)`
                    }
                  }
                }
              } catch (_) { /* no bloquear el envío si falla la consulta del planning */ }
            }

            const turnoEmoji = cierreActualizado.turno === 'mañana' ? '🟡' : cierreActualizado.turno === 'tarde' ? '🔵' : '🌙'

            const mensaje = [
              `✅ <b>Cierre completado</b>`,
              ``,
              `👤 <b>${cierreActualizado.trabajador}</b> · ${turnoEmoji} ${turnoLabel}`,
              `💰 ${ventasStr}`,
              `🕐 ${hora} · ${fecha}${siguienteTurnoLine}`,
            ].join('\n')

            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
            const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
              const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: TELEGRAM_CHAT_ID,
                  text: mensaje,
                  parse_mode: 'HTML',
                  disable_web_page_preview: true,
                  reply_markup: {
                    inline_keyboard: [[
                      { text: 'Ver panel de cierres →', url: `${process.env.NEXTAUTH_URL}/admin/cierres` }
                    ]]
                  }
                }),
              })

              if (response.ok) {
                console.log('Notificación de cierre enviada a Telegram')
              } else {
                console.error('Error enviando notificación a Telegram:', await response.text())
              }
            }
          } catch (telegramError) {
            console.error('Error enviando notificación a Telegram:', telegramError)
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
