import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_DIAS = 3

// GET - Obtener detalle de un lote específico
export async function GET(request, { params }) {
    try {
        const { id } = await params

        const lote = await prisma.loteMasa.findUnique({
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

        const ahora = new Date()
        const elaboracion = new Date(lote.fechaElaboracion)
        const diasTranscurridos = Math.floor((ahora - elaboracion) / (1000 * 60 * 60 * 24))

        let estadoVisual = 'ok'
        let color = 'green'
        let icono = '✅'
        let diasRestantes = MAX_DIAS - diasTranscurridos

        if (diasTranscurridos >= MAX_DIAS) {
            estadoVisual = 'caducado'
            color = 'red'
            icono = '🔴'
            diasRestantes = 0
        } else if (diasTranscurridos === MAX_DIAS - 1) {
            estadoVisual = 'proximo'
            color = 'yellow'
            icono = '🟡'
        }

        return NextResponse.json({ ...lote, diasTranscurridos, diasRestantes, estadoVisual, color, icono })
    } catch (error) {
        console.error('Error fetching lote de masa:', error)
        return NextResponse.json({ error: 'Error al obtener lote de masa' }, { status: 500 })
    }
}

// PUT - Finalizar lote de masa
export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const { motivoFinalizacion } = await request.json()

        if (!motivoFinalizacion || !['finalizado', 'merma'].includes(motivoFinalizacion)) {
            return NextResponse.json({
                error: 'Motivo de finalización inválido. Debe ser "finalizado" o "merma"'
            }, { status: 400 })
        }

        const lote = await prisma.loteMasa.update({
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
        console.error('Error updating lote de masa:', error)
        return NextResponse.json({ error: 'Error al finalizar lote de masa' }, { status: 500 })
    }
}
