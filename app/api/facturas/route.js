import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeInvoice } from '@/lib/gemini';

// GET - Obtener todas las facturas
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const mes = searchParams.get('mes');
        const año = searchParams.get('año');
        const categoria = searchParams.get('categoria');
        const pagada = searchParams.get('pagada');

        // Construir filtros
        const where = {};

        if (mes && año) {
            const startDate = new Date(año, mes - 1, 1);
            const endDate = new Date(año, mes, 0, 23, 59, 59);
            where.fecha = {
                gte: startDate,
                lte: endDate
            };
        }

        if (categoria && categoria !== 'todas') {
            where.categoria = categoria;
        }

        if (pagada !== null && pagada !== undefined) {
            where.pagada = pagada === 'true';
        }

        const facturas = await prisma.factura.findMany({
            where,
            include: {
                lineas: true,
                proveedor: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        return NextResponse.json({ facturas });

    } catch (error) {
        console.error('Error fetching facturas:', error);
        return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
    }
}

// POST - Crear nueva factura (con escaneo IA)
export async function POST(request) {
    try {
        const data = await request.json();
        const { imageUrl } = data;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // 1. Analizar con IA
        let analysisResult;
        try {
            analysisResult = await analyzeInvoice(imageUrl);
        } catch (aiError) {
            console.error("Error en análisis IA:", aiError);
            return NextResponse.json({
                error: 'Error analizando la factura con IA',
                details: aiError.message
            }, { status: 500 });
        }

        // 2. Buscar o crear proveedor
        let proveedorId = null;
        if (analysisResult.proveedor?.nombre) {
            // Construir condiciones de búsqueda
            const searchConditions = [
                { nombre: analysisResult.proveedor.nombre }
            ];

            // Solo añadir búsqueda por NIF si existe
            if (analysisResult.proveedor.nif) {
                searchConditions.push({ nif: analysisResult.proveedor.nif });
            }

            let proveedor = await prisma.proveedor.findFirst({
                where: {
                    OR: searchConditions
                }
            });

            if (!proveedor) {
                // Crear nuevo proveedor
                proveedor = await prisma.proveedor.create({
                    data: {
                        nombre: analysisResult.proveedor.nombre,
                        nif: analysisResult.proveedor.nif || null,
                        direccion: analysisResult.proveedor.direccion || null,
                        categoria: analysisResult.categoria || 'otros'
                    }
                });
            }

            proveedorId = proveedor.id;
        }

        // 3. Crear factura con líneas
        const factura = await prisma.factura.create({
            data: {
                numero: analysisResult.numero || 'SIN-NUMERO',
                tipo: 'compra',
                proveedorId: proveedorId,
                proveedorNombre: analysisResult.proveedor?.nombre || 'Proveedor desconocido',
                proveedorNIF: analysisResult.proveedor?.nif || null,
                categoria: analysisResult.categoria || 'otros',
                subtotal: parseFloat((analysisResult.subtotal || 0).toFixed(2)),
                iva: parseFloat((analysisResult.iva || 0).toFixed(2)),
                total: parseFloat((analysisResult.total || 0).toFixed(2)),
                fecha: analysisResult.fecha ? new Date(analysisResult.fecha) : new Date(),
                fechaVencimiento: analysisResult.fechaVencimiento ? new Date(analysisResult.fechaVencimiento) : null,
                imagenUrl: imageUrl,
                escaneadaIA: true,
                lineas: {
                    create: (analysisResult.lineas || []).map(linea => ({
                        concepto: linea.concepto,
                        cantidad: parseFloat((linea.cantidad || 1).toFixed(2)),
                        precioUnitario: parseFloat((linea.precioUnitario || 0).toFixed(2)),
                        total: parseFloat((linea.total || 0).toFixed(2))
                    }))
                }
            },
            include: {
                lineas: true,
                proveedor: true
            }
        });

        return NextResponse.json({
            success: true,
            factura,
            analysisResult
        });

    } catch (error) {
        console.error('Error creating factura:', error);
        return NextResponse.json({
            error: 'Error al crear factura',
            details: error.message
        }, { status: 500 });
    }
}
