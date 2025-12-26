import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeTicket } from '@/lib/gemini';

export async function POST(request) {
    try {
        const data = await request.json();
        const { imageUrl } = data;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // 1. Crear el registro inicial
        let ticket = await prisma.ticketDiario.create({
            data: {
                imageUrl,
                status: 'procesando',
            },
        });

        // 2. Analizar con IA (esto podría hacerse en background si fuera muy lento, pero Flash es rápido)
        try {
            const analysisResult = await analyzeTicket(imageUrl);

            // 3. Actualizar con los resultados
            ticket = await prisma.ticketDiario.update({
                where: { id: ticket.id },
                data: {
                    fecha: new Date(), // Usar fecha/hora actual del sistema
                    total: analysisResult.total || 0,
                    items: analysisResult.items || [],
                    rawResponse: JSON.stringify(analysisResult),
                    status: 'completado',
                },
            });

            return NextResponse.json({ success: true, ticket });

        } catch (aiError) {
            console.error("Error en análisis IA:", aiError);
            // Actualizar estado a error pero mantener la imagen
            await prisma.ticketDiario.update({
                where: { id: ticket.id },
                data: {
                    status: 'error',
                    rawResponse: aiError.message
                }
            });

            return NextResponse.json({
                success: false,
                error: 'Error analizando la imagen, pero se guardó el registro.',
                ticketId: ticket.id
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error processing ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const tickets = await prisma.ticketDiario.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50, // Limitar a los últimos 50 por ahora
        });
        return NextResponse.json({ tickets });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 });
    }
}
