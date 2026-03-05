import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF report for product sales analytics.
 * @param {Object} params
 * @param {string[]} params.chips - Selected product names
 * @param {{ from: Date, to: Date }} params.date - Date range
 * @param {string} params.groupBy - Grouping period (day/week/month)
 * @param {{ totalRevenue, totalUnits, avgPricePerUnit, ticketsAppeared }} params.summary
 * @param {Array<{ period, revenue, units }>} params.trend
 * @param {Array<{ product, revenue, units }>} params.breakdown
 * @param {string|null} params.aiInsight
 */
export function generateProductSalesPDF({ chips, date, groupBy, summary, trend, breakdown, aiInsight }) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const blue = [14, 165, 233];
    const emerald = [16, 185, 129];
    const gray = [75, 85, 99];
    const dark = [17, 24, 39];

    const fromStr = date.from.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const toStr = date.to.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const groupLabel = { day: 'Diaria', week: 'Semanal', month: 'Mensual' }[groupBy] || 'Mensual';

    let y = 20;

    // ── HEADER ──────────────────────────────────────────────
    doc.setFontSize(22);
    doc.setTextColor(...blue);
    doc.setFont('helvetica', 'bold');
    doc.text("EVA'S BARCELONA", 20, y);

    y += 9;
    doc.setFontSize(13);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text(`Informe de Ventas por Producto`, 20, y);

    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(`Período: ${fromStr} — ${toStr}  |  Agrupación: ${groupLabel}`, 20, y);

    y += 5;
    doc.setFontSize(9);
    doc.text(`Productos: ${chips.join(', ')}`, 20, y);

    y += 4;
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // ── 1. KPI SUMMARY ───────────────────────────────────────
    doc.setFontSize(13);
    doc.setTextColor(...blue);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumen General', 20, y);
    y += 7;

    autoTable(doc, {
        startY: y,
        head: [['Métrica', 'Valor']],
        body: [
            ['Ingresos totales', `${summary.totalRevenue.toFixed(2)} €`],
            ['Unidades vendidas', `${summary.totalUnits} uds`],
            ['Precio medio por unidad', `${summary.avgPricePerUnit.toFixed(2)} €`],
            ['Tickets en que apareció', `${summary.ticketsAppeared} tickets`],
        ],
        theme: 'striped',
        headStyles: { fillColor: blue },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 },
    });
    y = doc.lastAutoTable.finalY + 12;

    // ── 2. TREND ─────────────────────────────────────────────
    if (trend.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }

        doc.setFontSize(13);
        doc.setTextColor(...emerald);
        doc.setFont('helvetica', 'bold');
        doc.text(`2. Tendencia ${groupLabel}`, 20, y);
        y += 7;

        autoTable(doc, {
            startY: y,
            head: [['Período', 'Ingresos (€)', 'Unidades']],
            body: trend.map(t => [
                t.period,
                `${t.revenue.toFixed(2)} €`,
                `${t.units} uds`,
            ]),
            theme: 'striped',
            headStyles: { fillColor: emerald },
            foot: [[
                'TOTAL',
                `${summary.totalRevenue.toFixed(2)} €`,
                `${summary.totalUnits} uds`,
            ]],
            footStyles: { fillColor: [240, 253, 244], textColor: dark, fontStyle: 'bold' },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 10 },
        });
        y = doc.lastAutoTable.finalY + 12;
    }

    // ── 3. BREAKDOWN ─────────────────────────────────────────
    if (breakdown.length > 0) {
        if (y > 200) { doc.addPage(); y = 20; }

        doc.setFontSize(13);
        doc.setTextColor(...dark);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Desglose por Variante', 20, y);
        y += 7;

        autoTable(doc, {
            startY: y,
            head: [['Producto / Variante', 'Ingresos (€)', 'Unidades', '% Ingreso']],
            body: breakdown.map(b => [
                b.product,
                `${b.revenue.toFixed(2)} €`,
                `${b.units} uds`,
                summary.totalRevenue > 0
                    ? `${((b.revenue / summary.totalRevenue) * 100).toFixed(1)}%`
                    : '—',
            ]),
            theme: 'striped',
            headStyles: { fillColor: dark },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 'auto' } },
        });
        y = doc.lastAutoTable.finalY + 12;
    }

    // ── FOOTER (all pages) ──────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} · Eva's Barcelona`, 20, 287);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, 287, { align: 'right' });
    }

    const fileName = `ventas-producto_${chips.slice(0, 2).join('-').replace(/\s+/g, '_')}_${date.from.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}
