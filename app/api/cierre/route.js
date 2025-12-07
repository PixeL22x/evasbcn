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
          nombre: '¿La pica está limpia?',
          duracion: 1,
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
        },
        {
          nombre: 'Total de ventas del día',
          duracion: 2,
          requiereInput: true,
          inputType: 'ventas'
        }
      ],
      tarde: [
        // 🧊 Bloque 1 - Preparación Inicial
        {
          nombre: '🧊 Bloque 1 - Preparación Inicial',
          duracion: 8,
          subtareas: JSON.stringify([
            'Preparar cubeta con agua + Fairy',
            'Trapos cubo agua + lejía',
            'Guardar cosas secas'
          ])
        },
        // 🍦 Bloque 2 - Helados y Limpieza
        {
          nombre: '🍦 Bloque 2 - Helados y Limpieza',
          duracion: 12,
          subtareas: JSON.stringify([
            'Separar helados y quitar barras metálicas',
            'Guardar smoothies + Milkshakes + Hielo Picado',
            'Cerrar cajas de galletas',
            'Barrer y aspirar'
          ])
        },
        // 🪟 Bloque 3 - Cierre al Público
        {
          nombre: '🪟 Bloque 3 - Cierre al Público',
          duracion: 6,
          subtareas: JSON.stringify([
            'Meter carteles',
            'Cerrar puerta',
            'Apagar luces menos blancas'
          ])
        },
        // ☂️ Confirmación Toldo
        {
          nombre: '¿El toldo está cerrado correctamente?',
          duracion: 1,
        },
        // 🍧 Bloque 4 - Organización Helados
        {
          nombre: '🍧 Bloque 4 - Organización Helados',
          duracion: 12,
          subtareas: JSON.stringify([
            'Sacar pinchos + cucharas',
            'Tapar helados',
            'Guardar helados Isa 1 hacia congelador enfrente blanco',
            'Guardar helados Isa 2 congelador gris'
          ])
        },
        // 🧴 Bloque 5 - Limpieza y Documentación
        {
          nombre: '🧴 Bloque 5 - Limpieza y Documentación',
          duracion: 5,
          subtareas: JSON.stringify([
            'Sacar pinchos y cucharas a secar',
            'Sacar basura'
          ])
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
            { tipo: 'isa2_apagada', descripcion: 'ISA 2 apagada' }
          ])
        },
        // 🌬️ Confirmación Ventiladores
        {
          nombre: '¿Los ventiladores del techo están apagados?',
          duracion: 1,
        },
        // ⚙️ Bloque 6 - Apagado de Equipos
        {
          nombre: '⚙️ Bloque 6 - Apagado de Equipos',
          duracion: 5,
          subtareas: JSON.stringify([
            'Apagar Just Eat y TPV',
            'Apagar datáfonos y móvil, también cargarlos'
          ])
        },
        // 🧽 Bloque 7 - Limpieza Final
        {
          nombre: '🧽 Bloque 7 - Limpieza Final',
          duracion: 7,
          subtareas: JSON.stringify([
            'Limpiar con esponja lugar de cucharas',
            'Fregar + Escurrir fregona y tirar agua del cubo'
          ])
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

// Obtener cierres con paginación y filtros
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Parámetros de filtro
    const search = searchParams.get('search') || ''
    const turno = searchParams.get('turno') || 'todos'
    const dateRange = searchParams.get('dateRange') || 'todos'

    // Construir where clause
    const where = {}

    if (search) {
      where.trabajador = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (turno !== 'todos') {
      where.turno = turno
    }

    if (dateRange !== 'todos') {
      const now = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
      }

      where.fechaInicio = {
        gte: startDate
      }
    }

    // Ejecutar queries en transacción
    const [cierres, total] = await prisma.$transaction([
      prisma.cierre.findMany({
        where,
        skip,
        take: limit,
        include: {
          tareas: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.cierre.count({ where }),
    ])

    return NextResponse.json({
      cierres,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })
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
