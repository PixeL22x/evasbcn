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

        // 1. Analizar con IA (con validación robusta)
        let analysisResult;
        try {
            analysisResult = await analyzeInvoice(imageUrl);
        } catch (aiError) {
            console.error("Error en análisis IA:", {
                error: aiError.message,
                imageUrl,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                error: 'Error analizando la factura con IA',
                details: aiError.message,
                type: 'AI_ANALYSIS_ERROR'
            }, { status: 500 });
        }

        // 2. Usar transacción para garantizar atomicidad
        let result;
        try {
            result = await prisma.$transaction(async (tx) => {
                let proveedorId = null;

                // 2a. Buscar o crear proveedor (con búsqueda case-insensitive)
                if (analysisResult.proveedor?.nombre) {
                    let proveedor = await tx.proveedor.findFirst({
                        where: {
                            nombre: {
                                equals: analysisResult.proveedor.nombre,
                                mode: 'insensitive'
                            }
                        }
                    });

                    if (!proveedor) {
                        // Crear nuevo proveedor
                        proveedor = await tx.proveedor.create({
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

                // 2b. Crear factura con líneas
                const factura = await tx.factura.create({
                    data: {
                        numero: analysisResult.numero,
                        tipo: 'compra',
                        proveedorId: proveedorId,
                        proveedorNombre: analysisResult.proveedor?.nombre || 'Proveedor desconocido',
                        proveedorNIF: analysisResult.proveedor?.nif || null,
                        categoria: analysisResult.categoria,
                        subtotal: parseFloat(analysisResult.subtotal.toFixed(2)),
                        iva: parseFloat(analysisResult.iva.toFixed(2)),
                        total: parseFloat(analysisResult.total.toFixed(2)),
                        fecha: new Date(analysisResult.fecha),
                        fechaVencimiento: analysisResult.fechaVencimiento ? new Date(analysisResult.fechaVencimiento) : null,
                        imagenUrl: imageUrl,
                        escaneadaIA: true,
                        lineas: {
                            create: analysisResult.lineas.map(linea => ({
                                concepto: linea.concepto,
                                cantidad: parseFloat(linea.cantidad.toFixed(2)),
                                precioUnitario: parseFloat(linea.precioUnitario.toFixed(2)),
                                total: parseFloat(linea.total.toFixed(2))
                            }))
                        }
                    },
                    include: {
                        lineas: true,
                        proveedor: true
                    }
                });

                return factura;
            });
        } catch (dbError) {
            console.error('Error en base de datos:', {
                error: dbError.message,
                stack: dbError.stack,
                analysisResult,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                error: 'Error al guardar en base de datos',
                details: dbError.message,
                type: 'DATABASE_ERROR'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            factura: result,
            analysisResult
        });

    } catch (error) {
        console.error('Error creating factura:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({
            error: 'Error al crear factura',
            details: error.message,
            type: 'UNKNOWN_ERROR'
        }, { status: 500 });
    }
}
