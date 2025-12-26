import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request, { params }) {
    try {
        // Next.js 15+ requires awaiting params
        const { id } = await params;

        // Delete the ticket
        await prisma.ticketDiario.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Ticket eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar ticket:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el ticket' },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        // Next.js 15+ requires awaiting params
        const { id } = await params;
        const data = await request.json();

        // Update the ticket with provided fields
        const ticket = await prisma.ticketDiario.update({
            where: { id },
            data: {
                ...(data.fecha && { fecha: new Date(data.fecha) }),
                ...(data.total !== undefined && { total: data.total }),
                ...(data.items && { items: data.items }),
                ...(data.status && { status: data.status }),
            }
        });

        return NextResponse.json({
            success: true,
            ticket
        });

    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el ticket' },
            { status: 500 }
        );
    }
}
