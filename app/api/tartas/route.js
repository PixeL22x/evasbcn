import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener lotes activos o todos los lotes
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const trabajadorId = searchParams.get('trabajadorId')
        const includeFinalizados = searchParams.get('includeFinalizados') === 'true'

        const where = {
            ...(trabajadorId && { trabajadorId }),
            ...(includeFinalizados ? {} : { estado: 'activo' })
        }

        const lotes = await prisma.loteTarta.findMany({
            where,
            orderBy: { fechaEntrada: 'asc' }, // Más antiguos primero
            include: {
                trabajador: {
                    select: { nombre: true }
                }
            }
        })

        // Calcular estado dinámico para cada lote
        const lotesConEstado = lotes.map(lote => {
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

            return {
                ...lote,
                diasTranscurridos,
                diasRestantes,
                estadoVisual,
                color,
                icono
            }
        })

        return NextResponse.json(lotesConEstado)
    } catch (error) {
        console.error('Error fetching lotes:', error)
        return NextResponse.json({ error: 'Error al obtener lotes' }, { status: 500 })
    }
}

// POST - Crear nuevo lote
export async function POST(request) {
    try {
        const { sabor, fechaEntrada, trabajadorId } = await request.json()

        if (!sabor || !fechaEntrada || !trabajadorId) {
            return NextResponse.json({
                error: 'Sabor, fecha de entrada y trabajador son requeridos'
            }, { status: 400 })
        }

        // Calcular fecha límite (4 días después de la entrada)
        const entrada = new Date(fechaEntrada)
        const fechaLimite = new Date(entrada)
        fechaLimite.setDate(fechaLimite.getDate() + 4)

        const lote = await prisma.loteTarta.create({
            data: {
                sabor,
                fechaEntrada: entrada,
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
        console.error('Error creating lote:', error)
        return NextResponse.json({ error: 'Error al crear lote' }, { status: 500 })
    }
}
