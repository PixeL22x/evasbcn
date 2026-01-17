// Utilidad para exportar PDF de resumen de gastos
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CATEGORIAS = {
    helados: { label: 'Helados', emoji: '🍦' },
    ingredientes: { label: 'Ingredientes', emoji: '🥛' },
    packaging: { label: 'Packaging', emoji: '📦' },
    servicios: { label: 'Servicios', emoji: '⚡' },
    mantenimiento: { label: 'Mantenimiento', emoji: '🔧' },
    otros: { label: 'Otros', emoji: '📌' }
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const calcularPorCategorias = (facturas) => {
    const totales = {}
    const totalGeneral = facturas.reduce((sum, f) => sum + f.total, 0)

    facturas.forEach(f => {
        if (!totales[f.categoria]) {
            totales[f.categoria] = 0
        }
        totales[f.categoria] += f.total
    })

    return Object.entries(totales)
        .map(([cat, total]) => ({
            categoria: cat,
            nombre: CATEGORIAS[cat]?.label || cat,
            emoji: CATEGORIAS[cat]?.emoji || '📌',
            total,
            porcentaje: ((total / totalGeneral) * 100).toFixed(1)
        }))
        .sort((a, b) => b.total - a.total)
}

export const exportarPDF = async (facturas, mes, año) => {
    try {
        // Calcular totales
        const totalMes = facturas.reduce((sum, f) => sum + f.total, 0)
        const totalPendiente = facturas.filter(f => !f.pagada).reduce((sum, f) => sum + f.total, 0)
        const totalPagado = facturas.filter(f => f.pagada).reduce((sum, f) => sum + f.total, 0)
        const numPendientes = facturas.filter(f => !f.pagada).length
        const numPagadas = facturas.filter(f => f.pagada).length

        // Calcular por categorías
        const categorias = calcularPorCategorias(facturas)

        // Crear PDF
        const doc = new jsPDF()

        // Colores
        const azulPrimario = [59, 130, 246]
        const grisTexto = [107, 114, 128]

        let yPos = 20

        // ===== HEADER =====
        doc.setFontSize(24)
        doc.setTextColor(...azulPrimario)
        doc.setFont('helvetica', 'bold')
        doc.text("EVA'S BARCELONA", 20, yPos)

        yPos += 10
        doc.setFontSize(14)
        doc.setTextColor(...grisTexto)
        doc.setFont('helvetica', 'normal')
        const mesNombre = new Date(año, mes - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        doc.text(`Resumen de Gastos - ${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)}`, 20, yPos)

        yPos += 15

        // ===== RESUMEN EJECUTIVO =====
        autoTable(doc, {
            startY: yPos,
            head: [['Total del Mes', 'Pendiente', 'Pagado']],
            body: [[
                formatCurrency(totalMes),
                formatCurrency(totalPendiente),
                formatCurrency(totalPagado)
            ], [
                `${facturas.length} facturas`,
                `${numPendientes} sin pagar`,
                `${numPagadas} pagadas`
            ]],
            headStyles: {
                fillColor: azulPrimario,
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 20, right: 20 }
        })

        yPos = doc.lastAutoTable.finalY + 15

        // ===== DESGLOSE POR CATEGORÍAS =====
        doc.setFontSize(12)
        doc.setTextColor(...azulPrimario)
        doc.setFont('helvetica', 'bold')
        doc.text('Desglose por Categorias', 20, yPos)

        yPos += 5

        autoTable(doc, {
            startY: yPos,
            head: [['Categoria', 'Importe', 'Porcentaje']],
            body: categorias.map(cat => [
                cat.nombre,
                formatCurrency(cat.total),
                `${cat.porcentaje}%`
            ]),
            headStyles: {
                fillColor: azulPrimario,
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 20, right: 20 }
        })

        // ===== NUEVA PÁGINA: DETALLE DE FACTURAS =====
        doc.addPage()
        yPos = 20

        doc.setFontSize(12)
        doc.setTextColor(...azulPrimario)
        doc.setFont('helvetica', 'bold')
        doc.text('Detalle de Facturas', 20, yPos)

        yPos += 5

        autoTable(doc, {
            startY: yPos,
            head: [['Fecha', 'Proveedor', 'Numero', 'Categoria', 'Total', 'Estado']],
            body: facturas.map(f => [
                formatDate(f.fecha),
                f.proveedorNombre,
                f.numero,
                CATEGORIAS[f.categoria]?.label || f.categoria,
                formatCurrency(f.total),
                f.pagada ? 'Pagada' : 'Pendiente'
            ]),
            headStyles: {
                fillColor: azulPrimario,
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 45 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 },
                4: { cellWidth: 25 },
                5: { cellWidth: 28 }
            },
            margin: { left: 20, right: 20 }
        })

        // ===== FOOTER =====
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(...grisTexto)
            doc.setFont('helvetica', 'normal')

            const footerText = `Generado: ${new Date().toLocaleString('es-ES')} | Pagina ${i} de ${pageCount}`
            doc.text(footerText, 20, 285)

            doc.text("Eva's Barcelona - Sistema de Gestion", 105, 285, { align: 'center' })
        }

        // ===== GUARDAR =====
        const nombreArchivo = `gastos-${mesNombre.toLowerCase().replace(' ', '-')}.pdf`
        doc.save(nombreArchivo)

        return true
    } catch (error) {
        console.error('Error al generar PDF:', error)
        throw error
    }
}
