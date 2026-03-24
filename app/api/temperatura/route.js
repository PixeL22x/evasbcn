import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener registros de temperatura
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trabajadorId = searchParams.get('trabajadorId')
    const fecha = searchParams.get('fecha')
    const hoy = searchParams.get('hoy')

    let whereClause = {}

    if (trabajadorId) {
      whereClause.trabajadorId = trabajadorId
    }

    if (hoy === 'true') {
      const hoyDate = new Date()
      hoyDate.setHours(0, 0, 0, 0)
      const mananaDate = new Date(hoyDate)
      mananaDate.setDate(mananaDate.getDate() + 1)
      
      whereClause.fecha = {
        gte: hoyDate,
        lt: mananaDate
      }
    } else if (fecha) {
      const fechaDate = new Date(fecha)
      fechaDate.setHours(0, 0, 0, 0)
      const mananaDate = new Date(fechaDate)
      mananaDate.setDate(mananaDate.getDate() + 1)
      
      whereClause.fecha = {
        gte: fechaDate,
        lt: mananaDate
      }
    }

    const registros = await prisma.registroTemperatura.findMany({
      where: whereClause,
      include: {
        trabajador: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json({ registros })
  } catch (error) {
    console.error('Error al obtener registros de temperatura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo registro de temperatura
export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Incoming temperature record:', body)
    const { trabajadorId, temperatura, vitrina, hora, observaciones, fotoTermometro } = body

    // Validaciones
    if (!trabajadorId || temperatura === undefined || !hora || !vitrina) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    if (!['isa1', 'isa2'].includes(vitrina)) {
      return NextResponse.json(
        { error: 'La vitrina debe ser ISA 1 o ISA 2' },
        { status: 400 }
      )
    }

    // Validar rango de temperatura (configurable)
    const tempMin = -25 // Temperatura mínima
    const tempMax = 5   // Temperatura máxima
    
    if (temperatura < tempMin || temperatura > tempMax) {
      return NextResponse.json(
        { error: `La temperatura debe estar entre ${tempMin}°C y ${tempMax}°C` },
        { status: 400 }
      )
    }

    // Validar hora permitida
    const horasPermitidas = ['14:00', '18:00', '21:00']
    if (!horasPermitidas.includes(hora)) {
      return NextResponse.json(
        { error: 'Hora no permitida. Solo se permite 14:00, 18:00 o 21:00' },
        { status: 400 }
      )
    }

    // Verificar que no exista ya un registro para esta hora y vitrina hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    const registroExistente = await prisma.registroTemperatura.findFirst({
      where: {
        vitrina,
        hora,
        fecha: {
          gte: hoy,
          lt: manana
        }
      }
    })

    if (registroExistente) {
      const vName = vitrina === 'isa1' ? 'ISA 1' : 'ISA 2'
      return NextResponse.json(
        { error: `Ya existe un registro de ${vName} para las ${hora} hoy` },
        { status: 400 }
      )
    }

    // Crear el registro
    const registro = await prisma.registroTemperatura.create({
      data: {
        trabajadorId,
        temperatura: parseFloat(temperatura),
        vitrina,
        hora,
        fecha: new Date(),
        observaciones,
        fotoTermometro
      },
      include: {
        trabajador: {
          select: {
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({ 
      registro,
      message: 'Registro de temperatura creado exitosamente'
    })
  } catch (error) {
    console.error('Error al crear registro de temperatura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


















