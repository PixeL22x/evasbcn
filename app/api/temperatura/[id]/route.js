import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener un registro específico
export async function GET(request, { params }) {
  try {
    const { id } = params

    const registro = await prisma.registroTemperatura.findUnique({
      where: { id },
      include: {
        trabajador: {
          select: {
            nombre: true
          }
        }
      }
    })

    if (!registro) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ registro })
  } catch (error) {
    console.error('Error al obtener registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un registro
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { temperatura, observaciones, fotoTermometro } = body

    // Validaciones
    if (temperatura !== undefined) {
      const tempMin = -25
      const tempMax = 5
      
      if (temperatura < tempMin || temperatura > tempMax) {
        return NextResponse.json(
          { error: `La temperatura debe estar entre ${tempMin}°C y ${tempMax}°C` },
          { status: 400 }
        )
      }
    }

    const registro = await prisma.registroTemperatura.update({
      where: { id },
      data: {
        temperatura,
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
      message: 'Registro actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error al actualizar registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un registro
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.registroTemperatura.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Registro eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



