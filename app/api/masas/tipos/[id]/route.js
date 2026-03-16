import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Eliminar un tipo de masa específico
export async function DELETE(request, { params }) {
    try {
        const { id } = await params

        await prisma.tipoMasa.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Tipo de masa eliminado' })
    } catch (error) {
        console.error('Error al eliminar tipo de masa:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Tipo de masa no encontrado' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Error al eliminar tipo de masa' }, { status: 500 })
    }
}
