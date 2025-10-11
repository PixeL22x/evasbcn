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
        // 🧊 Bloque 1 - Preparación Inicial
        {
          nombre: '🧊 Bloque 1 - Preparar cubeta con agua + Fairy',
          duracion: 3,
        },
        {
          nombre: '🧊 Bloque 1 - Trapos cubo agua + lejía',
          duracion: 3,
        },
        {
          nombre: '🧊 Bloque 1 - Guardar cosas secas',
          duracion: 2,
        },
        // 🍦 Bloque 2 - Helados y Limpieza
        {
          nombre: '🍦 Bloque 2 - Separar helados y quitar barras metálicas',
          duracion: 4,
        },
        {
          nombre: '🍦 Bloque 2 - Guardar smoothies + Milkshakes + Hielo Picado',
          duracion: 3,
        },
        {
          nombre: '🍦 Bloque 2 - Barrer y aspirar',
          duracion: 5,
        },
        // 🪟 Bloque 3 - Cierre al Público
        {
          nombre: '🪟 Bloque 3 - Meter carteles',
          duracion: 2,
        },
        {
          nombre: '🪟 Bloque 3 - Cerrar puerta',
          duracion: 2,
        },
        {
          nombre: '🪟 Bloque 3 - Apagar luces menos blancas',
          duracion: 2,
        },
        // 🍧 Bloque 4 - Organización Helados
        {
          nombre: '🍧 Bloque 4 - Sacar pinchos + cucharas',
          duracion: 3,
        },
        {
          nombre: '🍧 Bloque 4 - Tapar helados',
          duracion: 3,
        },
        {
          nombre: '🍧 Bloque 4 - Guardar helados Isa 1 hacia congelador enfrente blanco',
          duracion: 3,
        },
        {
          nombre: '🍧 Bloque 4 - Guardar helados Isa 2 congelador gris',
          duracion: 3,
        },
        // 🧴 Bloque 5 - Limpieza y Documentación
        {
          nombre: '🧴 Bloque 5 - Sacar pinchos y cucharas a secar',
          duracion: 2,
        },
        {
          nombre: '🧴 Bloque 5 - Sacar basura',
          duracion: 3,
        },
        // 📋 Bloque 5.1 - Apuntar Info Cierre
        {
          nombre: '📋 Bloque 5.1 - Apuntar info cierre',
          duracion: 3,
          requiereFotos: true,
          fotosRequeridas: JSON.stringify([
            { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
            { tipo: 'ticket_bbva', descripcion: 'Ticket BBVA' },
            { tipo: 'ticket_caixa', descripcion: 'Ticket Caixa' },
            { tipo: 'ticket_ventas', descripcion: 'Ticket total' }
          ])
        },
        // 💰 Bloque 5.2 - Ingresar Ventas
        {
          nombre: '💰 Bloque 5.2 - Ingresa el total de ventas del día',
          duracion: 2,
          requiereInput: true,
          inputType: 'ventas'
        },
        // 📸 Bloque 5.3 - Fotos Máquinas Apagadas
        {
          nombre: '📸 Bloque 5.3 - Enviar fotos máquinas apagadas',
          duracion: 2,
          requiereFotos: true,
          fotosRequeridas: JSON.stringify([
            { tipo: 'crepera_apagada', descripcion: 'Crepera apagada' },
            { tipo: 'waflera_apagada', descripcion: 'Waflera apagada' },
            { tipo: 'aire_apagado', descripcion: 'Aire acondicionado apagado' },
            { tipo: 'ventilador_apagado', descripcion: 'Ventilador de techo apagado' }
          ])
        },
        // ⚙️ Bloque 6 - Apagado de Equipos
        {
          nombre: '⚙️ Bloque 6 - Apagar Just Eat y TPV',
          duracion: 3,
        },
        {
          nombre: '⚙️ Bloque 6 - Apagar datáfonos y móvil, también cargarlos',
          duracion: 2,
        },
        // 🧽 Bloque 7 - Limpieza Final
        {
          nombre: '🧽 Bloque 7 - Limpiar con esponja lugar de cucharas',
          duracion: 4,
        },
        {
          nombre: '🧽 Bloque 7 - Fregar + Escurrir fregona y tirar agua del cubo',
          duracion: 3,
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
