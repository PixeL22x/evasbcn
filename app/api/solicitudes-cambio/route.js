import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener todas las solicitudes de cambio
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trabajador = searchParams.get('trabajador')
    
    let solicitudes
    
    if (trabajador) {
      // Obtener solicitudes de un trabajador específico
      solicitudes = await prisma.solicitudCambioTurno.findMany({
        where: {
          OR: [
            { trabajadorSolicitante: trabajador },
            { trabajadorDestino: trabajador }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Obtener todas las solicitudes (para admin)
      solicitudes = await prisma.solicitudCambioTurno.findMany({
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(solicitudes)
  } catch (error) {
    console.error('Error fetching solicitudes:', error)
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva solicitud de cambio
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      trabajadorSolicitante, 
      trabajadorDestino, 
      fechaCambio,
      fechaReemplazo,
      motivo 
    } = body

    // Validaciones
    if (!trabajadorSolicitante || !trabajadorDestino || !fechaCambio || !fechaReemplazo || !motivo) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la fecha sea al menos 2 semanas en el futuro
    const fechaSolicitud = new Date()
    const fechaCambioDate = new Date(fechaCambio)
    const fechaReemplazoDate = new Date(fechaReemplazo)
    const dosSemanasEnMs = 14 * 24 * 60 * 60 * 1000
    
    if (fechaCambioDate.getTime() - fechaSolicitud.getTime() < dosSemanasEnMs) {
      return NextResponse.json(
        { error: 'La solicitud debe hacerse mínimo 2 semanas antes de la fecha del cambio' },
        { status: 400 }
      )
    }

    // Verificar que la fecha de reemplazo también sea al menos 2 semanas en el futuro
    if (fechaReemplazoDate.getTime() - fechaSolicitud.getTime() < dosSemanasEnMs) {
      return NextResponse.json(
        { error: 'La fecha de reemplazo debe ser al menos 2 semanas en el futuro' },
        { status: 400 }
      )
    }

    // Verificar que no sea el mismo trabajador
    if (trabajadorSolicitante.toLowerCase() === trabajadorDestino.toLowerCase()) {
      return NextResponse.json(
        { error: 'No puedes solicitar un cambio contigo mismo' },
        { status: 400 }
      )
    }

    // Verificar que no exista ya una solicitud pendiente del mismo trabajador para la misma fecha
    const solicitudExistente = await prisma.solicitudCambioTurno.findFirst({
      where: {
        trabajadorSolicitante,
        fechaCambio: fechaCambioDate,
        estado: 'pendiente'
      }
    })

    if (solicitudExistente) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente para esta fecha' },
        { status: 400 }
      )
    }

    // Crear la solicitud
    const solicitud = await prisma.solicitudCambioTurno.create({
      data: {
        trabajadorSolicitante,
        trabajadorDestino,
        fechaCambio: fechaCambioDate,
        fechaReemplazo: fechaReemplazoDate,
        motivo
      }
    })

    return NextResponse.json(solicitud, { status: 201 })
  } catch (error) {
    console.error('Error creating solicitud:', error)
    return NextResponse.json(
      { error: 'Error al crear la solicitud' },
      { status: 500 }
    )
  }
}
