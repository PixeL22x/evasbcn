import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  try {
    const { cierreId, turno, trabajador, fotos } = await request.json()

    if (!cierreId || !turno || !trabajador || !fotos) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Crear las fotos en la base de datos
    const ticketFotos = await Promise.all(
      fotos.map(foto => 
        prisma.ticketFoto.create({
          data: {
            cierreId,
            turno,
            trabajador,
            url: foto.url,
            publicId: foto.publicId
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Fotos guardadas correctamente',
      fotos: ticketFotos
    })

  } catch (error) {
    console.error('Error al guardar fotos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const cierreId = searchParams.get('cierreId')
    const turno = searchParams.get('turno')

    if (!cierreId) {
      return NextResponse.json(
        { error: 'ID de cierre requerido' },
        { status: 400 }
      )
    }

    const whereClause = { cierreId }
    if (turno) {
      whereClause.turno = turno
    }

    const fotos = await prisma.ticketFoto.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      fotos
    })

  } catch (error) {
    console.error('Error al obtener fotos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
