import { NextResponse } from 'next/server'
import { prisma, connectDB } from '../../../lib/prisma'

// Crear un nuevo cierre
export async function POST(request) {
  try {
    // Verificar conexión a la base de datos
    const isConnected = await connectDB()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      )
    }

    const { trabajador, turno } = await request.json()

    if (!trabajador || !trabajador.trim()) {
      return NextResponse.json(
        { error: 'El nombre del trabajador es requerido' },
        { status: 400 }
      )
    }

    if (!turno || !['mañana', 'tarde'].includes(turno)) {
      return NextResponse.json(
        { error: 'El turno debe ser "mañana" o "tarde"' },
        { status: 400 }
      )
    }

    // Definir tareas según el turno
    const tareasPorTurno = {
      mañana: [
        {
          nombre: 'Tirar agua del cubo',
          duracion: 2,
        },
        {
          nombre: 'Foto de la pica limpia',
          duracion: 1,
          requiereFotos: true,
          fotosRequeridas: JSON.stringify([
            { tipo: 'pica_limpia', descripcion: 'Pica limpia' }
          ])
        },
        {
          nombre: 'Fotos de Cuaderno apuntes, 2 fotos TPV y 1 foto datafono detalle operaciones',
          duracion: 3,
          requiereFotos: true,
          fotosRequeridas: JSON.stringify([
            { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
            { tipo: 'ticket_tpv_1', descripcion: 'Ticket TPV 1' },
            { tipo: 'ticket_tpv_2', descripcion: 'Ticket TPV 2' },
            { tipo: 'datafono_detalle', descripcion: 'Datafono detalle operaciones' }
          ])
        }
      ],
      tarde: [
        // Pre-cierre / Limpieza Inicial (1-6)
        {
          nombre: 'Escurrir fregona y tirar agua del cubo',
          duracion: 2,
        },
        {
          nombre: 'Preparar cubeta con agua + fairy (para cucharas y separadores)',
          duracion: 3,
        },
        {
          nombre: 'Guardar cosas secas',
          duracion: 2,
        },
        {
          nombre: 'Poner todos los trapos en cubo con agua + lejía',
          duracion: 3,
        },
        {
          nombre: 'Separar helados restos → congelador gris (parte superior)',
          duracion: 4,
        },
        {
          nombre: 'Barrer y aspirar el local',
          duracion: 5,
        },
        // Cierre al Público (7-8)
        {
          nombre: 'Apagar luces todas menos blancas',
          duracion: 2,
        },
        {
          nombre: 'Meter carteles y cerrar puerta + persiana',
          duracion: 5,
        },
        // Cierre Interno (9-15)
        {
          nombre: 'Limpiar con esponja lugar de cucharas ISA',
          duracion: 4,
        },
        {
          nombre: 'Guardar smoothies en la nevera blanca',
          duracion: 3,
        },
        {
          nombre: 'Tapar helados',
          duracion: 3,
        },
        {
          nombre: 'Guardar helados repetidos al arcón',
          duracion: 4,
        },
        {
          nombre: 'Sacar pinchos de los helados',
          duracion: 2,
        },
        {
          nombre: 'Sacar cucharas y pinchos a secar',
          duracion: 2,
        },
        {
          nombre: 'Sacar basura',
          duracion: 3,
        },
        // Administrativo (16-17)
        {
          nombre: 'Apuntar info de cierre en libreta, imprimir y grapar',
          duracion: 3,
          requiereFotos: true,
          fotosRequeridas: JSON.stringify([
            { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
            { tipo: 'ticket_bbva', descripcion: 'Ticket BBVA' },
            { tipo: 'ticket_caixa', descripcion: 'Ticket Caixa' },
            { tipo: 'ticket_ventas', descripcion: 'Ticket total' }
          ])
        },
        {
          nombre: 'Ingresar total de ventas del día',
          duracion: 2,
          requiereInput: true,
          inputType: 'ventas'
        },
        // Verificación (18)
        {
          nombre: 'Enviar foto de máquinas apagadas (gofre, aire, crepera, ventilador techo)',
          duracion: 2,
          requiereFotos: true,
          fotosRequeridas: JSON.stringify([
            { tipo: 'crepera_apagada', descripcion: 'Crepera apagada' },
            { tipo: 'waflera_apagada', descripcion: 'Waflera apagada' },
            { tipo: 'aire_apagado', descripcion: 'Aire acondicionado apagado' },
            { tipo: 'ventilador_apagado', descripcion: 'Ventilador de techo apagado' }
          ])
        },
        // Apagados Finales (19-20)
        {
          nombre: 'Apagar justeat y TPV',
          duracion: 3,
        },
        {
          nombre: 'Apagar y cargar datafonos',
          duracion: 2,
        },
      ]
    }

    // Crear el cierre con las tareas específicas del turno
    const cierre = await prisma.cierre.create({
      data: {
        trabajador: trabajador.trim(),
        turno: turno,
        tareas: {
          create: tareasPorTurno[turno],
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
