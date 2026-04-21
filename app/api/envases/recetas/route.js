import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Lista todas las recetas con su envase
export async function GET() {
    try {
        const recetas = await prisma.recetaEnvase.findMany({
            include: {
                envase: true,
            },
            orderBy: { productoNombre: 'asc' },
        });

        return NextResponse.json({ recetas });
    } catch (error) {
        console.error('Error fetching recetas:', error);
        return NextResponse.json({ error: 'Error al obtener recetas' }, { status: 500 });
    }
}

// POST - Crear nueva receta
export async function POST(request) {
    try {
        const { productoNombre, matchType, envaseId, cantidad } = await request.json();

        if (!productoNombre || !envaseId || cantidad == null) {
            return NextResponse.json(
                { error: 'productoNombre, envaseId y cantidad son requeridos' },
                { status: 400 }
            );
        }

        const receta = await prisma.recetaEnvase.create({
            data: {
                productoNombre: productoNombre.toLowerCase().trim(),
                matchType: matchType || 'contains',
                envaseId,
                cantidad: parseFloat(cantidad),
            },
            include: { envase: true },
        });

        return NextResponse.json({ receta });
    } catch (error) {
        console.error('Error creating receta:', error);
        return NextResponse.json({ error: 'Error al crear receta' }, { status: 500 });
    }
}

// PUT - Actualizar receta existente
export async function PUT(request) {
    try {
        const { id, productoNombre, matchType, envaseId, cantidad } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        const receta = await prisma.recetaEnvase.update({
            where: { id },
            data: {
                ...(productoNombre !== undefined && { productoNombre: productoNombre.toLowerCase().trim() }),
                ...(matchType !== undefined && { matchType }),
                ...(envaseId !== undefined && { envaseId }),
                ...(cantidad !== undefined && { cantidad: parseFloat(cantidad) }),
            },
            include: { envase: true },
        });

        return NextResponse.json({ receta });
    } catch (error) {
        console.error('Error updating receta:', error);
        return NextResponse.json({ error: 'Error al actualizar receta' }, { status: 500 });
    }
}

// DELETE - Borrar receta
export async function DELETE(request) {
    try {
        const { id } = await request.json();

        await prisma.recetaEnvase.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting receta:', error);
        return NextResponse.json({ error: 'Error al eliminar receta' }, { status: 500 });
    }
}
