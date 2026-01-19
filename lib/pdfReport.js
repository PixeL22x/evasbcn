import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateMonthlyPDF = ({ stats, notes, aiSummary, month, year }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors
    const bluePrimary = [59, 130, 246]; // Blue-500
    const grayText = [75, 85, 99]; // Gray-600
    const blackText = [17, 24, 39]; // Gray-900

    let yPos = 20;

    // ===== HEADER =====
    doc.setFontSize(24);
    doc.setTextColor(...bluePrimary);
    doc.setFont('helvetica', 'bold');
    doc.text("EVA'S BARCELONA", 20, yPos);

    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(...grayText);
    doc.setFont('helvetica', 'normal');
    const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    doc.text(`Informe Mensual de Gestión - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 20, yPos);

    yPos += 15;

    // ===== 1. RESUMEN EJECUTIVO (IA) =====
    doc.setFontSize(14);
    doc.setTextColor(...bluePrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumen Ejecutivo (IA)', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(...blackText);
    doc.setFont('helvetica', 'normal');

    // Split text to fit page width
    const splitText = doc.splitTextToSize(aiSummary || "Sin resumen disponible.", pageWidth - 40);
    doc.text(splitText, 20, yPos);

    yPos += (splitText.length * 5) + 10;

    // ===== 2. MÉTRICAS CLAVE =====
    doc.setFontSize(14);
    doc.setTextColor(...bluePrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Métricas Clave', 20, yPos);
    yPos += 8;

    autoTable(doc, {
        startY: yPos,
        head: [['Concepto', 'Valor']],
        body: [
            ['Ventas Totales', `${stats.totalSales.toFixed(2)}€`],
            ['Gastos Totales', `${stats.totalExpenses.toFixed(2)}€`],
            ['Resultado Neto', `${stats.netResult.toFixed(2)}€`],
            ['Venta Promedio Diaria', `${stats.avgTicket.toFixed(2)}€`],
            ['Días Activos', `${stats.ticketCount} días`],
            ['Horas Totales Personal', `${stats.totalStaffHours.toFixed(2)} h`],
        ],
        theme: 'striped',
        headStyles: { fillColor: bluePrimary },
        margin: { left: 20, right: 20 },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ===== 3. RECURSOS HUMANOS =====
    // Check if we need a page break
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(14);
    doc.setTextColor(...bluePrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Recursos Humanos', 20, yPos);
    yPos += 8;

    autoTable(doc, {
        startY: yPos,
        head: [['Trabajador', 'Horas', 'Turnos', 'Promedio/Turno']],
        body: stats.staffStats.map(s => [
            s.nombre,
            `${s.horas.toFixed(2)} h`,
            s.turnos,
            `${(s.turnos > 0 ? s.horas / s.turnos : 0).toFixed(2)} h`
        ]),
        headStyles: { fillColor: bluePrimary },
        margin: { left: 20, right: 20 },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ===== 4. BITÁCORA (NOTAS) =====
    if (notes && notes.length > 0) {
        if (yPos > 220) { doc.addPage(); yPos = 20; }

        doc.setFontSize(14);
        doc.setTextColor(...bluePrimary);
        doc.setFont('helvetica', 'bold');
        doc.text(`4. Bitácora del Mes (${notes.length} incidencias)`, 20, yPos);
        yPos += 8;

        autoTable(doc, {
            startY: yPos,
            head: [['Fecha', 'Título', 'Contenido']],
            body: notes.map(n => [
                format(new Date(n.fecha), 'dd/MM/yyyy'),
                n.titulo,
                n.contenido
            ]),
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 'auto' }
            },
            headStyles: { fillColor: grayText },
            margin: { left: 20, right: 20 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // ===== 5. DESGLOSE FINANCIERO =====
    // Ensure Top Products and Expenses fit or move to next page
    if (yPos > 200) { doc.addPage(); yPos = 20; }

    doc.setFontSize(14);
    doc.setTextColor(...bluePrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Desglose Financiero', 20, yPos);
    yPos += 8;

    // Side-by-side tables logic is tricky in autoTable, doing sequential for safety
    doc.setFontSize(12);
    doc.setTextColor(...blackText);
    doc.text('Top Productos (Unidades)', 20, yPos);
    yPos += 5;

    autoTable(doc, {
        startY: yPos,
        head: [['Producto', 'Cantidad', 'Ingresos']],
        body: stats.topProducts.map(p => [
            p.nombre,
            p.cantidad,
            `${p.ingresos.toFixed(2)}€`
        ]),
        headStyles: { fillColor: [16, 185, 129] }, // Emerald
        margin: { left: 20, right: 100 }, // Make it half width-ish
        tableWidth: 80
    });

    let rightColY = yPos;

    // Expenses Table (Right side if possible, or below)
    // To simplify: Just put it below for now to avoid overlap issues
    yPos = doc.lastAutoTable.finalY + 10;

    doc.text('Gastos por Categoría', 20, yPos);
    yPos += 5;

    const expenseRows = Object.entries(stats.expenseCategories)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, total]) => [
            cat.charAt(0).toUpperCase() + cat.slice(1),
            `${total.toFixed(2)}€`,
            `${((total / stats.totalExpenses) * 100).toFixed(1)}%`
        ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Categoría', 'Total', '%']],
        body: expenseRows,
        headStyles: { fillColor: [239, 68, 68] }, // Red
        margin: { left: 20, right: 20 },
    });

    // ===== FOOTER =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-ES')}`, 20, 285);
        doc.text("Eva's Barcelona", pageWidth - 20, 285, { align: 'right' });
    }

    // Save
    doc.save(`Informe_Mensual_${month}_${year}.pdf`);
};
