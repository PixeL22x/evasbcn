import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// GET - Obtener todos los documentos de un trabajador
export async function GET(request, { params }) {
    try {
        const { id } = params

        if (!id) {
            return NextResponse.json(
                { error: 'ID del trabajador es requerido' },
                { status: 400 }
            )
        }

        const documentos = await prisma.documento.findMany({
            where: {
                trabajadorId: id
            },
            orderBy: {
                fechaSubida: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            documentos
        })

    } catch (error) {
        console.error('Error al obtener documentos:', error)
        return NextResponse.json(
            { error: 'Error al obtener documentos' },
            { status: 500 }
        )
    }
}

// POST - Crear nuevo registro de documento
export async function POST(request, { params }) {
    try {
        const { id } = params
        const { nombre, url, tipo, categoria } = await request.json()

        if (!id || !nombre || !url) {
            return NextResponse.json(
                { error: 'Datos incompletos' },
                { status: 400 }
            )
        }

        const nuevoDocumento = await prisma.documento.create({
            data: {
                trabajadorId: id,
                nombre,
                url,
                tipo: tipo || 'file',
                categoria: categoria || 'otros'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Documento registrado exitosamente',
            documento: nuevoDocumento
        })

    } catch (error) {
        console.error('Error al registrar documento:', error)
        return NextResponse.json(
            { error: 'Error al registrar documento' },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar documento
export async function DELETE(request, { params }) {
    try {
        const { searchParams } = new URL(request.url)
        const docId = searchParams.get('docId')

        if (!docId) {
            return NextResponse.json(
                { error: 'ID del documento es requerido' },
                { status: 400 }
            )
        }

        const documento = await prisma.documento.findUnique({
            where: { id: docId }
        })

        if (!documento) {
            return NextResponse.json(
                { error: 'Documento no encontrado' },
                { status: 404 }
            )
        }

        if (params.id && documento.trabajadorId !== params.id) {
            return NextResponse.json(
                { error: 'Documento no pertenece al trabajador' },
                { status: 403 }
            )
        }

        await prisma.documento.delete({
            where: { id: docId }
        })

        return NextResponse.json({
            success: true,
            message: 'Documento eliminado exitosamente'
        })

    } catch (error) {
        console.error('Error al eliminar documento:', error)
        return NextResponse.json(
            { error: 'Error al eliminar documento' },
            { status: 500 }
        )
    }
}
