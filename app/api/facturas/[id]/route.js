import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener una factura específica
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const factura = await prisma.factura.findUnique({
            where: { id },
            include: {
                lineas: true,
                proveedor: true
            }
        });

        if (!factura) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ factura });

    } catch (error) {
        console.error('Error fetching factura:', error);
        return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
    }
}

// PATCH - Actualizar factura
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();

        // Extraer líneas si vienen en el update
        const { lineas, ...facturaData } = data;

        // Si se actualizan líneas, eliminar las antiguas primero
        if (lineas && Array.isArray(lineas)) {
            await prisma.lineaFactura.deleteMany({
                where: { facturaId: id }
            });
        }

        // Actualizar factura (y crear líneas si existen)
        const factura = await prisma.factura.update({
            where: { id },
            data: {
                ...facturaData,
                revisada: true, // Marcar como revisada manualmente
                ...(lineas && Array.isArray(lineas) && {
                    lineas: {
                        create: lineas.map(linea => ({
                            concepto: linea.concepto,
                            cantidad: linea.cantidad || 1,
                            precioUnitario: linea.precioUnitario || 0,
                            total: linea.total || 0
                        }))
                    }
                })
            },
            include: {
                lineas: true,
                proveedor: true
            }
        });

        return NextResponse.json({
            success: true,
            factura
        });

    } catch (error) {
        console.error('Error updating factura:', error);
        return NextResponse.json({
            error: 'Error al actualizar factura',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE - Eliminar factura
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Las líneas se eliminan automáticamente por onDelete: Cascade
        await prisma.factura.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Factura eliminada correctamente'
        });

    } catch (error) {
        console.error('Error deleting factura:', error);
        return NextResponse.json({
            error: 'Error al eliminar factura',
            details: error.message
        }, { status: 500 });
    }
}
