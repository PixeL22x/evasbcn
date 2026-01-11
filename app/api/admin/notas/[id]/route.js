import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH - Actualizar nota
export async function PATCH(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            titulo,
            contenido,
            categoria,
            prioridad,
            fecha,
            trabajadorRelacionado,
            etiquetas,
            archivada
        } = body

        // Construir objeto de actualización solo con campos proporcionados
        const updateData = {}

        if (titulo !== undefined) updateData.titulo = titulo
        if (contenido !== undefined) updateData.contenido = contenido
        if (categoria !== undefined) {
            const categoriasValidas = ['cambio_turno', 'horario', 'incidencia', 'general', 'financiero']
            if (!categoriasValidas.includes(categoria)) {
                return NextResponse.json(
                    { error: 'Categoría no válida' },
                    { status: 400 }
                )
            }
            updateData.categoria = categoria
        }
        if (prioridad !== undefined) {
            const prioridadesValidas = ['baja', 'normal', 'alta']
            if (!prioridadesValidas.includes(prioridad)) {
                return NextResponse.json(
                    { error: 'Prioridad no válida' },
                    { status: 400 }
                )
            }
            updateData.prioridad = prioridad
        }
        if (fecha !== undefined) updateData.fecha = new Date(fecha)
        if (trabajadorRelacionado !== undefined) updateData.trabajadorRelacionado = trabajadorRelacionado
        if (etiquetas !== undefined) updateData.etiquetas = JSON.stringify(etiquetas)
        if (archivada !== undefined) updateData.archivada = archivada

        const nota = await prisma.notaAdmin.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(nota)
    } catch (error) {
        console.error('Error al actualizar nota:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Nota no encontrada' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Error al actualizar la nota' },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar nota permanentemente
export async function DELETE(request, { params }) {
    try {
        const { id } = await params

        // Hard delete: eliminar permanentemente
        const nota = await prisma.notaAdmin.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Nota eliminada correctamente', nota })
    } catch (error) {
        console.error('Error al eliminar nota:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Nota no encontrada' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Error al eliminar la nota' },
            { status: 500 }
        )
    }
}

