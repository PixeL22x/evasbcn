import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT — marcar como comprado / actualizar urgente
export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()

        const data = {}

        if (body.estado === 'comprado') {
            data.estado = 'comprado'
            data.compradoAt = new Date()
        }
        if (body.estado === 'pendiente') {
            data.estado = 'pendiente'
            data.compradoAt = null
        }
        if (typeof body.urgente === 'boolean') {
            data.urgente = body.urgente
        }

        const item = await prisma.itemCompra.update({
            where: { id },
            data,
            include: { trabajador: { select: { nombre: true, id: true } } }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('Error updating item compra:', error)
        return NextResponse.json({ error: 'Error al actualizar el ítem' }, { status: 500 })
    }
}

// DELETE — borrar un ítem
export async function DELETE(request, { params }) {
    try {
        const { id } = await params
        await prisma.itemCompra.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        // P2025 = registro no encontrado — tratarlo como éxito (ya estaba borrado)
        if (error?.code === 'P2025') {
            return NextResponse.json({ ok: true })
        }
        console.error('Error deleting item compra:', error)
        return NextResponse.json({ error: 'Error al eliminar el ítem' }, { status: 500 })
    }
}
