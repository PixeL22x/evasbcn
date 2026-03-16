import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_DIAS = 3

// GET - Obtener lotes activos (o todos si includeFinalizados=true)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const trabajadorId = searchParams.get('trabajadorId')
        const includeFinalizados = searchParams.get('includeFinalizados') === 'true'

        const where = {
            ...(trabajadorId && { trabajadorId }),
            ...(includeFinalizados ? {} : { estado: 'activo' })
        }

        const lotes = await prisma.loteMasa.findMany({
            where,
            orderBy: { fechaElaboracion: 'asc' }, // Más antiguos primero
            include: {
                trabajador: {
                    select: { nombre: true }
                }
            }
        })

        // Calcular estado dinámico para cada lote
        const lotesConEstado = lotes.map(lote => {
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

            return {
                ...lote,
                numero: lote.numero ?? '–',
                diasTranscurridos,
                diasRestantes,
                estadoVisual,
                color,
                icono
            }
        })

        return NextResponse.json(lotesConEstado)
    } catch (error) {
        console.error('Error fetching lotes de masa:', error)
        return NextResponse.json({ error: 'Error al obtener lotes de masa' }, { status: 500 })
    }
}

// POST - Crear nuevo lote de masa
export async function POST(request) {
    try {
        const { tipo, fechaElaboracion, trabajadorId } = await request.json()

        if (!tipo || !fechaElaboracion || !trabajadorId) {
            return NextResponse.json({
                error: 'Tipo, fecha de elaboración y trabajador son requeridos'
            }, { status: 400 })
        }

        // Calcular el siguiente número de lote (máximo global + 1)
        const lastLote = await prisma.loteMasa.findFirst({
            orderBy: { numero: 'desc' }
        })
        const numero = lastLote ? lastLote.numero + 1 : 1

        // Calcular fecha límite (3 días después de la elaboración)
        const elaboracion = new Date(fechaElaboracion)
        const fechaLimite = new Date(elaboracion)
        fechaLimite.setDate(fechaLimite.getDate() + MAX_DIAS)

        const lote = await prisma.loteMasa.create({
            data: {
                numero,
                tipo,
                fechaElaboracion: elaboracion,
                fechaLimite,
                trabajadorId,
                estado: 'activo'
            },
            include: {
                trabajador: {
                    select: { nombre: true }
                }
            }
        })

        return NextResponse.json(lote)
    } catch (error) {
        console.error('Error creating lote de masa:', error)
        return NextResponse.json({ error: 'Error al crear lote de masa' }, { status: 500 })
    }
}
