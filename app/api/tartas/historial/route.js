import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener historial de lotes finalizados
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const trabajadorId = searchParams.get('trabajadorId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where = {
            estado: { in: ['finalizado', 'merma'] },
            ...(trabajadorId && { trabajadorId })
        }

        const [lotes, total] = await Promise.all([
            prisma.loteTarta.findMany({
                where,
                orderBy: { fechaFinalizacion: 'desc' },
                skip,
                take: limit,
                include: {
                    trabajador: {
                        select: { nombre: true }
                    }
                }
            }),
            prisma.loteTarta.count({ where })
        ])

        return NextResponse.json({
            data: lotes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching historial:', error)
        return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
    }
}
