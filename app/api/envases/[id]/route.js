import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Actualizar envase (incluye ajuste de stock)
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();

        const envase = await prisma.envase.update({
            where: { id },
            data: {
                ...(data.nombre !== undefined && { nombre: data.nombre }),
                ...(data.categoria !== undefined && { categoria: data.categoria }),
                ...(data.stockActual !== undefined && { stockActual: data.stockActual }),
                ...(data.stockMinimo !== undefined && { stockMinimo: data.stockMinimo }),
                ...(data.unidad !== undefined && { unidad: data.unidad }),
                ...(data.activo !== undefined && { activo: data.activo }),
            },
        });

        return NextResponse.json({ envase });
    } catch (error) {
        console.error('Error updating envase:', error);
        return NextResponse.json({ error: 'Error al actualizar envase' }, { status: 500 });
    }
}

// DELETE - Borrar envase (también borra sus recetas por cascade)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        await prisma.envase.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting envase:', error);
        return NextResponse.json({ error: 'Error al eliminar envase' }, { status: 500 });
    }
}
