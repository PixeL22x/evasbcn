import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Eliminar un sabor específico
export async function DELETE(request, { params }) {
    try {
        const { id } = await params

        await prisma.saborTarta.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Sabor eliminado' })
    } catch (error) {
        console.error('Error al eliminar sabor:', error)

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Sabor no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { error: 'Error al eliminar sabor' },
            { status: 500 }
        )
    }
}
