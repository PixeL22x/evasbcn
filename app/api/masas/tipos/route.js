import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los tipos de masa
export async function GET() {
    try {
        const tipos = await prisma.tipoMasa.findMany({
            orderBy: { nombre: 'asc' }
        })
        return NextResponse.json(tipos)
    } catch (error) {
        console.error('Error al obtener tipos de masa:', error)
        return NextResponse.json({ error: 'Error al obtener tipos de masa' }, { status: 500 })
    }
}

// POST - Crear nuevo tipo de masa
export async function POST(request) {
    try {
        const { nombre } = await request.json()

        if (!nombre || !nombre.trim()) {
            return NextResponse.json({ error: 'El nombre del tipo es requerido' }, { status: 400 })
        }

        const tipo = await prisma.tipoMasa.create({
            data: { nombre: nombre.trim() }
        })

        return NextResponse.json(tipo)
    } catch (error) {
        console.error('Error al crear tipo de masa:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Este tipo ya existe' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Error al crear tipo de masa' }, { status: 500 })
    }
}

// DELETE - Eliminar todos los tipos de masa
export async function DELETE() {
    try {
        await prisma.tipoMasa.deleteMany({})
        return NextResponse.json({ message: 'Todos los tipos de masa eliminados' })
    } catch (error) {
        console.error('Error al eliminar tipos de masa:', error)
        return NextResponse.json({ error: 'Error al eliminar tipos de masa' }, { status: 500 })
    }
}
