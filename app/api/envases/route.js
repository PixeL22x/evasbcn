import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Lista todos los envases
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const envases = await prisma.envase.findMany({
            where: includeInactive ? {} : { activo: true },
            include: {
                recetas: true,
            },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json({ envases });
    } catch (error) {
        console.error('Error fetching envases:', error);
        return NextResponse.json({ error: 'Error al obtener envases' }, { status: 500 });
    }
}

// POST - Crear nuevo envase
export async function POST(request) {
    try {
        const { nombre, categoria, stockActual, stockMinimo, unidad } = await request.json();

        if (!nombre || !categoria) {
            return NextResponse.json({ error: 'Nombre y categoría son requeridos' }, { status: 400 });
        }

        const envase = await prisma.envase.create({
            data: {
                nombre,
                categoria,
                stockActual: stockActual ?? 0,
                stockMinimo: stockMinimo ?? 50,
                unidad: unidad || 'ud',
            },
        });

        return NextResponse.json({ envase });
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe un envase con ese nombre' }, { status: 400 });
        }
        console.error('Error creating envase:', error);
        return NextResponse.json({ error: 'Error al crear envase' }, { status: 500 });
    }
}
