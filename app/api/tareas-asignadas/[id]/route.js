import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT — worker completa tarea (con nota) / admin edita cualquier campo
export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { estado, notasWorker, titulo, descripcion, categoria, prioridad, fechaLimite } = body

        const data = {
            ...(titulo      !== undefined && { titulo }),
            ...(descripcion !== undefined && { descripcion }),
            ...(categoria   !== undefined && { categoria }),
            ...(prioridad   !== undefined && { prioridad }),
            ...(fechaLimite !== undefined && { fechaLimite: fechaLimite ? new Date(fechaLimite) : null }),
            ...(notasWorker !== undefined && { notasWorker }),
        }

        if (estado) {
            data.estado = estado
            if (estado === 'completada') {
                data.completadaAt = new Date()
            } else if (estado === 'pendiente') {
                data.completadaAt = null
            }
        }

        const tarea = await prisma.tareaAsignada.update({
            where: { id },
            data,
            include: {
                trabajador: { select: { id: true, nombre: true } }
            }
        })

        return NextResponse.json(tarea)
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
        }
        console.error('Error updating tarea:', error)
        return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 })
    }
}

// DELETE — admin elimina
export async function DELETE(request, { params }) {
    try {
        const { id } = await params
        await prisma.tareaAsignada.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
        }
        console.error('Error deleting tarea:', error)
        return NextResponse.json({ error: 'Error al eliminar tarea' }, { status: 500 })
    }
}
