import { NextResponse } from 'next/server'
import { prisma, connectDB } from '../../../lib/prisma'

// Tareas de apertura (fijas, no dependen del turno)
const tareasApertura = [
  {
    nombre: '🔓 Abrir candados y subir persiana',
    duracion: 3,
  },
  {
    nombre: '💡 Encender luces, ventiladores y aire',
    duracion: 5,
    subtareas: JSON.stringify([
      'Luz Entrada',
      'Luz al lado de la pizarra rosa',
      'Luz nevera polos',
      "Luz ISA's",
      'Luz nevera refrescos',
      'Luz vitrina cajas BCN',
      'Luz al lado de la cafetera',
      'Luz arriba de la tele',
      'Ventiladores del techo',
      'Aire acondicionado'
    ])
  },
  {
    nombre: '🧊 Encender máquina de granizados',
    duracion: 2,
  },
  {
    nombre: '🧺 Enjuagar trapos y colocarlos',
    duracion: 3,
  },
  {
    nombre: "🍦 Limpiar ISA's y colocar barras de metal",
    duracion: 10,
  },
  {
    nombre: '🧹 Barrer y fregar el suelo zona clientes',
    duracion: 10,
  },
  {
    nombre: "❄️ Encender ISA's",
    duracion: 2,
  },
  {
    nombre: '🍨 Colocar helados y nombres',
    duracion: 15,
  },
  {
    nombre: '🧊 Guardar tapas de helados en el congelador pequeño (Pasadizo)',
    duracion: 3,
  },
  {
    nombre: '🥤 Traer milkshakes & smoothies al congelador pequeño (Pasadizo)',
    duracion: 5,
  },
  {
    nombre: '📋 Sacar carteles, pizarra, cono y bancos',
    duracion: 5,
  },
  {
    nombre: '🔊 Encender altavoz',
    duracion: 1,
  },
  {
    nombre: '📺 Encender tele y poner vídeo',
    duracion: 3,
    subtareas: JSON.stringify([
      'Encender la tele',
      'Ir a Fuentes → USB',
      'Seleccionar el vídeo y poner en modo bucle',
      'Quitar la barra de vídeo'
    ])
  },
  {
    nombre: '☂️ Abrir toldo',
    duracion: 2,
  }
]

// Crear una nueva apertura
export async function POST(request) {
  try {
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

    if (!turno || !['mañana', 'tarde', 'noche'].includes(turno)) {
      return NextResponse.json(
        { error: 'El turno debe ser "mañana", "tarde" o "noche"' },
        { status: 400 }
      )
    }

    // Intentar obtener tareas personalizadas de la BD
    const configKey = `apertura_tasks_${turno}`
    let tareasConfig = await prisma.configuracion.findUnique({
      where: { clave: configKey }
    })

    let tareasParaUsar = []

    if (tareasConfig && tareasConfig.valor) {
      const todasLasTareas = tareasConfig.valor
      tareasParaUsar = Array.isArray(todasLasTareas)
        ? todasLasTareas.filter(t => t.activa !== false)
        : []
    } else {
      // Usar defaults y guardar en BD
      tareasParaUsar = tareasApertura
      await prisma.configuracion.create({
        data: {
          clave: configKey,
          valor: tareasParaUsar
        }
      }).catch(err => console.error('Error guardando config apertura default:', err))
    }

    // Limpiar campos de configuración que no existen en el modelo Tarea
    const tareasLimpias = tareasParaUsar.map(({ activa, requiereEscaneo, ...tarea }) => {
      if (tarea.requiereFotos && tarea.fotosRequeridas) {
        try {
          const fotos = JSON.parse(tarea.fotosRequeridas)
          const fotosActivas = fotos.filter(f => f.activa !== false)
          const fotosLimpias = fotosActivas.map(({ activa, ...foto }) => foto)
          return { ...tarea, fotosRequeridas: JSON.stringify(fotosLimpias) }
        } catch (e) {
          return tarea
        }
      }
      return tarea
    })

    // Crear apertura usando el modelo Cierre con tipo='apertura'
    const apertura = await prisma.cierre.create({
      data: {
        trabajador: trabajador.trim(),
        turno: turno,
        tipo: 'apertura',
        tareas: {
          create: tareasLimpias,
        },
      },
      include: {
        tareas: true,
      },
    })

    return NextResponse.json({ aperturaId: apertura.id, apertura })
  } catch (error) {
    console.error('Error al crear apertura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Obtener aperturas con paginación y filtros
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const turno = searchParams.get('turno') || 'todos'
    const dateRange = searchParams.get('dateRange') || 'todos'
    const trabajadorFilter = searchParams.get('trabajador') || 'todos'

    const where = { tipo: 'apertura' }

    if (trabajadorFilter !== 'todos') {
      where.trabajador = trabajadorFilter
    } else if (search) {
      where.trabajador = { contains: search, mode: 'insensitive' }
    }

    if (turno !== 'todos') {
      where.turno = turno
    }

    if (dateRange !== 'todos') {
      const now = new Date()
      const startDate = new Date()
      switch (dateRange) {
        case '7d': startDate.setDate(now.getDate() - 7); break
        case '30d': startDate.setDate(now.getDate() - 30); break
        case '90d': startDate.setDate(now.getDate() - 90); break
      }
      where.fechaInicio = { gte: startDate }
    }

    const [aperturas, total] = await prisma.$transaction([
      prisma.cierre.findMany({
        where,
        skip,
        take: limit,
        include: { tareas: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cierre.count({ where }),
    ])

    return NextResponse.json({
      aperturas,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })
  } catch (error) {
    console.error('Error al obtener aperturas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Eliminar una apertura
export async function DELETE(request) {
  try {
    const { aperturaId } = await request.json()
    if (!aperturaId) {
      return NextResponse.json({ error: 'ID de apertura es requerido' }, { status: 400 })
    }
    await prisma.cierre.delete({ where: { id: aperturaId } })
    return NextResponse.json({ message: 'Apertura eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar apertura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
