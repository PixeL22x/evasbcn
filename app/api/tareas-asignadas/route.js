import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTareasTelegramMessage } from '@/lib/telegram'

// GET — admin: todas | worker: las suyas (filtrar por trabajadorId)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const trabajadorId = searchParams.get('trabajadorId')
        const estado = searchParams.get('estado') // pendiente | completada | all
        const prioridad = searchParams.get('prioridad')

        const where = {
            ...(trabajadorId && { trabajadorId }),
            ...(estado && estado !== 'all' && { estado }),
            ...(prioridad && { prioridad }),
        }

        const tareas = await prisma.tareaAsignada.findMany({
            where,
            orderBy: [
                // Urgentes primero, luego por fecha de creación
                { prioridad: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                trabajador: { select: { id: true, nombre: true } }
            }
        })

        return NextResponse.json(tareas)
    } catch (error) {
        console.error('Error fetching tareas asignadas:', error)
        return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 })
    }
}

// POST — admin crea tarea, opcionalmente notifica por Telegram
export async function POST(request) {
    try {
        const body = await request.json()
        const { titulo, descripcion, categoria, prioridad, trabajadorId, creadaPor, fechaLimite, notificarTelegram } = body

        if (!titulo || !trabajadorId || !creadaPor) {
            return NextResponse.json(
                { error: 'Título, trabajador y creador son requeridos' },
                { status: 400 }
            )
        }

        const tarea = await prisma.tareaAsignada.create({
            data: {
                titulo,
                descripcion: descripcion || null,
                categoria: categoria || 'limpieza',
                prioridad: prioridad || 'normal',
                trabajadorId,
                creadaPor,
                fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
                estado: 'pendiente',
            },
            include: {
                trabajador: { select: { id: true, nombre: true } }
            }
        })

        // Notificación Telegram opcional
        if (notificarTelegram) {
            const mensaje = `📋 *Hay nuevas tareas operativas asignadas.*\nPor favor, revisad la aplicación en "Mis tareas".`

            // Llamada directa a la utilidad (bot dedicado a tareas)
            await sendTareasTelegramMessage(mensaje).catch(err =>
                console.error('Error enviando Telegram tareas:', err)
            )
        }

        return NextResponse.json(tarea, { status: 201 })
    } catch (error) {
        console.error('Error creating tarea asignada:', error)
        return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 })
    }
}
