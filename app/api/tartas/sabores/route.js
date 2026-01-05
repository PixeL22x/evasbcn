import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los sabores
export async function GET() {
    try {
        const sabores = await prisma.saborTarta.findMany({
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(sabores)
    } catch (error) {
        console.error('Error al obtener sabores:', error)
        return NextResponse.json(
            { error: 'Error al obtener sabores' },
            { status: 500 }
        )
    }
}

// POST - Crear nuevo sabor
export async function POST(request) {
    try {
        const { nombre } = await request.json()

        if (!nombre || !nombre.trim()) {
            return NextResponse.json(
                { error: 'El nombre del sabor es requerido' },
                { status: 400 }
            )
        }

        const sabor = await prisma.saborTarta.create({
            data: {
                nombre: nombre.trim()
            }
        })

        return NextResponse.json(sabor)
    } catch (error) {
        console.error('Error al crear sabor:', error)

        // Check for unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Este sabor ya existe' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Error al crear sabor' },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar todos los sabores
export async function DELETE() {
    try {
        await prisma.saborTarta.deleteMany({})

        return NextResponse.json({ message: 'Todos los sabores eliminados' })
    } catch (error) {
        console.error('Error al eliminar sabores:', error)
        return NextResponse.json(
            { error: 'Error al eliminar sabores' },
            { status: 500 }
        )
    }
}
