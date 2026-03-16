import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — todos los ítems (pendientes primero, luego comprados)
export async function GET() {
    try {
        const items = await prisma.itemCompra.findMany({
            orderBy: [
                { urgente: 'desc' },
                { creadoAt: 'desc' }
            ],
            include: {
                trabajador: { select: { nombre: true, id: true } }
            }
        })
        return NextResponse.json(items)
    } catch (error) {
        console.error('Error fetching lista compras:', error)
        return NextResponse.json({ error: 'Error al obtener la lista' }, { status: 500 })
    }
}

// POST — añadir ítem (worker o admin)
export async function POST(request) {
    try {
        const { nombre, cantidad, unidad, urgente, trabajadorId } = await request.json()

        if (!nombre?.trim() || !trabajadorId) {
            return NextResponse.json({ error: 'Nombre y trabajador requeridos' }, { status: 400 })
        }

        // Bloqueo horario — el frontend ya controla esto,
        // pero validamos también en servidor
        const ahora = new Date()
        const horaActual = ahora.getHours() * 60 + ahora.getMinutes()
        const limite = 20 * 60 + 30 // 20:30

        if (horaActual >= limite) {
            return NextResponse.json(
                { error: 'La lista se cierra a las 20:30. Contacta con el admin.' },
                { status: 403 }
            )
        }

        const item = await prisma.itemCompra.create({
            data: {
                nombre: nombre.trim(),
                cantidad: cantidad ? parseFloat(cantidad) : null,
                unidad: unidad?.trim() || null,
                urgente: urgente ?? false,
                trabajadorId
            },
            include: {
                trabajador: { select: { nombre: true, id: true } }
            }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('Error creating item compra:', error)
        return NextResponse.json({ error: 'Error al añadir el ítem' }, { status: 500 })
    }
}

// DELETE — limpiar comprados (bulk, solo admin)
export async function DELETE() {
    try {
        const result = await prisma.itemCompra.deleteMany({
            where: { estado: 'comprado' }
        })
        return NextResponse.json({ deleted: result.count })
    } catch (error) {
        console.error('Error cleaning comprados:', error)
        return NextResponse.json({ error: 'Error al limpiar comprados' }, { status: 500 })
    }
}
