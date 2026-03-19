import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener detalle de un lote específico
export async function GET(request, { params }) {
    try {
        const { id } = await params

        const lote = await prisma.loteTarta.findUnique({
            where: { id },
            include: {
                trabajador: {
                    select: { nombre: true }
                }
            }
        })

        if (!lote) {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }

        // Calcular estado dinámico
        const ahora = new Date()
        const entrada = new Date(lote.fechaEntrada)
        const diasTranscurridos = Math.floor((ahora - entrada) / (1000 * 60 * 60 * 24))

        let estadoVisual = 'ok'
        let color = 'green'
        let icono = '✅'
        let diasRestantes = 4 - diasTranscurridos

        if (diasTranscurridos >= 4) {
            estadoVisual = 'caducado'
            color = 'red'
            icono = '🔴'
            diasRestantes = 0
        } else if (diasTranscurridos === 3) {
            estadoVisual = 'proximo'
            color = 'yellow'
            icono = '🟡'
        }

        return NextResponse.json({
            ...lote,
            diasTranscurridos,
            diasRestantes,
            estadoVisual,
            color,
            icono
        })
    } catch (error) {
        console.error('Error fetching lote:', error)
        return NextResponse.json({ error: 'Error al obtener lote' }, { status: 500 })
    }
}

// PUT - Finalizar lote
export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const { motivoFinalizacion } = await request.json()

        if (!motivoFinalizacion || !['finalizado', 'merma'].includes(motivoFinalizacion)) {
            return NextResponse.json({
                error: 'Motivo de finalización inválido. Debe ser "finalizado" o "merma"'
            }, { status: 400 })
        }

        const lote = await prisma.loteTarta.update({
            where: { id },
            data: {
                estado: motivoFinalizacion,
                motivoFinalizacion,
                fechaFinalizacion: new Date()
            },
            include: {
                trabajador: {
                    select: { nombre: true }
                }
            }
        })

        return NextResponse.json(lote)
    } catch (error) {
        console.error('Error updating lote:', error)
        return NextResponse.json({ error: 'Error al finalizar lote' }, { status: 500 })
    }
}

// DELETE - Eliminar lote (entrada por error)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params
        await prisma.loteTarta.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
        }
        console.error('Error al eliminar lote de tarta:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
