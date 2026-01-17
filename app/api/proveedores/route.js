import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los proveedores
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get('categoria');
        const activo = searchParams.get('activo');

        const where = {};

        if (categoria && categoria !== 'todas') {
            where.categoria = categoria;
        }

        if (activo !== null && activo !== undefined) {
            where.activo = activo === 'true';
        }

        const proveedores = await prisma.proveedor.findMany({
            where,
            include: {
                _count: {
                    select: { facturas: true }
                }
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        return NextResponse.json({ proveedores });

    } catch (error) {
        console.error('Error fetching proveedores:', error);
        return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
    }
}

// POST - Crear nuevo proveedor
export async function POST(request) {
    try {
        const data = await request.json();

        const proveedor = await prisma.proveedor.create({
            data: {
                nombre: data.nombre,
                nif: data.nif || null,
                telefono: data.telefono || null,
                email: data.email || null,
                direccion: data.direccion || null,
                categoria: data.categoria || 'otros',
                notas: data.notas || null
            }
        });

        return NextResponse.json({
            success: true,
            proveedor
        });

    } catch (error) {
        console.error('Error creating proveedor:', error);
        return NextResponse.json({
            error: 'Error al crear proveedor',
            details: error.message
        }, { status: 500 });
    }
}
