import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// Crear un nuevo cierre
export async function POST(request) {
  try {
    const { trabajador } = await request.json()

    if (!trabajador || !trabajador.trim()) {
      return NextResponse.json(
        { error: 'El nombre del trabajador es requerido' },
        { status: 400 }
      )
    }

    // Crear el cierre con las tareas predefinidas
    const cierre = await prisma.cierre.create({
      data: {
        trabajador: trabajador.trim(),
        tareas: {
          create: [
            {
              nombre: 'Apagar luces todas menos blancas',
              duracion: 2,
            },
            {
              nombre: 'Meter carteles',
              duracion: 3,
            },
            {
              nombre: 'Cerrar puerta y persiana',
              duracion: 2,
            },
            {
              nombre: 'Sacar basura',
              duracion: 3,
            },
            {
              nombre: 'Limpiar con esponja lugar de cucharas ISA',
              duracion: 4,
            },
            {
              nombre: 'Guardar smoothies a Nevera blanca',
              duracion: 3,
            },
            {
              nombre: 'Sacar pinchos',
              duracion: 2,
            },
            {
              nombre: 'Tapar helados',
              duracion: 3,
            },
            {
              nombre: 'Guardar helados repetidos a arcon',
              duracion: 4,
            },
            {
              nombre: 'Sacar cucharas y pinchos a secar',
              duracion: 2,
            },
            {
              nombre: 'Apuntar info cierre en libreta, imprimir, grapar',
              duracion: 3,
            },
            {
              nombre: 'Enviar foto de maquinas apagadas (gofre, aire)',
              duracion: 2,
            },
            {
              nombre: 'Apagar y cargar datafonos',
              duracion: 2,
            },
            {
              nombre: 'Apagar justeat, tpv, ventilador de techo',
              duracion: 3,
            },
          ],
        },
      },
      include: {
        tareas: true,
      },
    })

    return NextResponse.json({ cierreId: cierre.id, cierre })
  } catch (error) {
    console.error('Error al crear cierre:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Obtener todos los cierres (para administración)
export async function GET() {
  try {
    const cierres = await prisma.cierre.findMany({
      include: {
        tareas: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ cierres })
  } catch (error) {
    console.error('Error al obtener cierres:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Eliminar un cierre
export async function DELETE(request) {
  try {
    const { cierreId } = await request.json()

    if (!cierreId) {
      return NextResponse.json(
        { error: 'ID de cierre es requerido' },
        { status: 400 }
      )
    }

    // Eliminar el cierre (las tareas se eliminan automáticamente por CASCADE)
    await prisma.cierre.delete({
      where: { id: cierreId },
    })

    return NextResponse.json({ message: 'Cierre eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cierre:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
