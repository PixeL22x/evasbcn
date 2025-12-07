
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: List records (optionally filtered by worker and date)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const trabajadorId = searchParams.get('trabajadorId')
        const fecha = searchParams.get('fecha') // YYYY-MM-DD
        const mes = searchParams.get('mes') // MM
        const anio = searchParams.get('anio') // YYYY

        let whereClause = {}

        if (trabajadorId) whereClause.trabajadorId = trabajadorId

        if (fecha) {
            const start = new Date(fecha)
            const end = new Date(fecha)
            end.setDate(end.getDate() + 1)
            whereClause.fecha = { gte: start, lt: end }
        } else if (mes && anio) {
            const start = new Date(Date.UTC(anio, mes - 1, 1))
            const end = new Date(Date.UTC(anio, mes, 1))
            whereClause.fecha = { gte: start, lt: end }
        }

        const registros = await prisma.registroHorario.findMany({
            where: whereClause,
            orderBy: { entrada: 'desc' },
            include: { trabajador: { select: { nombre: true } } }
        })

        return NextResponse.json({ registros })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Clock In (Entrada)
export async function POST(request) {
    try {
        const body = await request.json()
        const { trabajadorId, tipo = "turno", observaciones } = body

        if (!trabajadorId) {
            return NextResponse.json({ error: 'Falta trabajadorId' }, { status: 400 })
        }

        // Check if already clocked in (open record)
        const openRecord = await prisma.registroHorario.findFirst({
            where: {
                trabajadorId,
                salida: null
            }
        })

        if (openRecord) {
            return NextResponse.json({ error: 'Ya tienes un turno abierto. Debes fichar salida primero.' }, { status: 409 })
        }

        const now = new Date()
        // Normalized date (00:00 UTC) for easier querying by day
        const fecha = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

        const registro = await prisma.registroHorario.create({
            data: {
                trabajadorId,
                fecha,
                entrada: now,
                tipo,
                observaciones
            }
        })

        return NextResponse.json(registro)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Clock Out (Salida) or Update
export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, action, salida, validado, observaciones } = body

        if (action === 'clock-out') {
            // Find open record for worker
            const { trabajadorId } = body
            if (!trabajadorId) return NextResponse.json({ error: 'Falta trabajadorId' }, { status: 400 })

            const openRecord = await prisma.registroHorario.findFirst({
                where: { trabajadorId, salida: null },
                orderBy: { entrada: 'desc' }
            })

            if (!openRecord) {
                return NextResponse.json({ error: 'No hay turno abierto para cerrar.' }, { status: 404 })
            }

            const updated = await prisma.registroHorario.update({
                where: { id: openRecord.id },
                data: {
                    salida: new Date(),
                    observaciones: observaciones || openRecord.observaciones
                }
            })
            return NextResponse.json(updated)
        }

        // Manual Update (Admin)
        if (id) {
            const dataToUpdate = {}
            if (salida) dataToUpdate.salida = new Date(salida)
            if (validado !== undefined) dataToUpdate.validado = validado
            if (observaciones) dataToUpdate.observaciones = observaciones

            const updated = await prisma.registroHorario.update({
                where: { id },
                data: dataToUpdate
            })
            return NextResponse.json(updated)
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
