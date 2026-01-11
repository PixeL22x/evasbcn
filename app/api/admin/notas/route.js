import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Listar notas con filtros
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const mes = searchParams.get('mes')
        const año = searchParams.get('año')
        const categoria = searchParams.get('categoria')
        const archivada = searchParams.get('archivada')
        const busqueda = searchParams.get('busqueda')

        // Construir filtros
        const where = {}

        // Filtro por archivada (por defecto no mostrar archivadas)
        if (archivada === 'true') {
            where.archivada = true
        } else if (archivada === 'false') {
            where.archivada = false
        } else {
            where.archivada = false // Por defecto no mostrar archivadas
        }

        // Filtro por categoría
        if (categoria) {
            where.categoria = categoria
        }

        // Filtro por mes y año
        if (mes && año) {
            const mesNum = parseInt(mes)
            const añoNum = parseInt(año)
            const startDate = new Date(añoNum, mesNum - 1, 1)
            const endDate = new Date(añoNum, mesNum, 0, 23, 59, 59)

            where.fecha = {
                gte: startDate,
                lte: endDate
            }
        }

        // Búsqueda en título y contenido
        if (busqueda) {
            where.OR = [
                { titulo: { contains: busqueda, mode: 'insensitive' } },
                { contenido: { contains: busqueda, mode: 'insensitive' } }
            ]
        }

        const notas = await prisma.notaAdmin.findMany({
            where,
            orderBy: [
                { prioridad: 'desc' }, // Primero las de alta prioridad
                { fecha: 'desc' }      // Luego por fecha más reciente
            ]
        })

        return NextResponse.json(notas)
    } catch (error) {
        console.error('Error al obtener notas:', error)
        return NextResponse.json(
            { error: 'Error al obtener las notas' },
            { status: 500 }
        )
    }
}

// POST - Crear nueva nota
export async function POST(request) {
    try {
        const body = await request.json()
        const {
            titulo,
            contenido,
            categoria,
            prioridad = 'normal',
            fecha,
            trabajadorRelacionado,
            etiquetas
        } = body

        // Validaciones
        if (!titulo || !contenido || !categoria) {
            return NextResponse.json(
                { error: 'Título, contenido y categoría son obligatorios' },
                { status: 400 }
            )
        }

        // Validar categoría
        const categoriasValidas = ['cambio_turno', 'horario', 'incidencia', 'general', 'financiero']
        if (!categoriasValidas.includes(categoria)) {
            return NextResponse.json(
                { error: 'Categoría no válida' },
                { status: 400 }
            )
        }

        // Validar prioridad
        const prioridadesValidas = ['baja', 'normal', 'alta']
        if (!prioridadesValidas.includes(prioridad)) {
            return NextResponse.json(
                { error: 'Prioridad no válida' },
                { status: 400 }
            )
        }

        const nota = await prisma.notaAdmin.create({
            data: {
                titulo,
                contenido,
                categoria,
                prioridad,
                fecha: fecha ? new Date(fecha) : new Date(),
                trabajadorRelacionado,
                etiquetas: etiquetas ? JSON.stringify(etiquetas) : null
            }
        })

        return NextResponse.json(nota, { status: 201 })
    } catch (error) {
        console.error('Error al crear nota:', error)
        return NextResponse.json(
            { error: 'Error al crear la nota' },
            { status: 500 }
        )
    }
}
