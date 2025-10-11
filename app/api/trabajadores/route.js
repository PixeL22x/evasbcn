import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - Obtener todos los trabajadores
export async function GET() {
  try {
    const trabajadores = await prisma.trabajador.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      trabajadores
    })

  } catch (error) {
    console.error('Error al obtener trabajadores:', error)
    return NextResponse.json(
      { error: 'Error al obtener trabajadores' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo trabajador
export async function POST(request) {
  try {
    const { nombre, password } = await request.json()

    if (!nombre || !password) {
      return NextResponse.json(
        { error: 'Nombre y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el trabajador ya existe
    const trabajadorExistente = await prisma.trabajador.findUnique({
      where: { nombre }
    })

    if (trabajadorExistente) {
      return NextResponse.json(
        { error: 'Ya existe un trabajador con ese nombre' },
        { status: 400 }
      )
    }

    // Crear nuevo trabajador
    const nuevoTrabajador = await prisma.trabajador.create({
      data: {
        nombre,
        password // En producción, aquí deberías hashear la contraseña
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Trabajador creado exitosamente',
      trabajador: {
        id: nuevoTrabajador.id,
        nombre: nuevoTrabajador.nombre,
        activo: nuevoTrabajador.activo,
        createdAt: nuevoTrabajador.createdAt
      }
    })

  } catch (error) {
    console.error('Error al crear trabajador:', error)
    return NextResponse.json(
      { error: 'Error al crear trabajador' },
      { status: 500 }
    )
  }
}











