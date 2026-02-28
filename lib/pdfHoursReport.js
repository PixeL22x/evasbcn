import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateHoursPDF = ({ staffStats, notes, aiAnalysis, totalHours, month, year, monthLabel }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors
    const emeraldPrimary = [16, 185, 129]; // Emerald-500
    const grayText = [75, 85, 99]; // Gray-600
    const blackText = [17, 24, 39]; // Gray-900

    let yPos = 20;

    // ===== HEADER =====
    doc.setFontSize(24);
    doc.setTextColor(...emeraldPrimary);
    doc.setFont('helvetica', 'bold');
    doc.text("EVA'S BARCELONA", 20, yPos);

    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(...grayText);
    doc.setFont('helvetica', 'normal');
    doc.text(`Informe de Horas - ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, 20, yPos);

    yPos += 15;

    // ===== 1. RESUMEN DE HORAS =====
    doc.setFontSize(14);
    doc.setTextColor(...emeraldPrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumen de Horas', 20, yPos);
    yPos += 8;

    autoTable(doc, {
        startY: yPos,
        head: [['Concepto', 'Valor']],
        body: [
            ['Total Horas Planificadas', `${totalHours.toFixed(2)} h`],
            ['Número de Trabajadores', `${staffStats.length} personas`],
            ['Promedio por Trabajador', `${(totalHours / staffStats.length).toFixed(2)} h`],
        ],
        theme: 'striped',
        headStyles: { fillColor: emeraldPrimary },
        margin: { left: 20, right: 20 },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ===== 3. HORAS POR TRABAJADOR =====
    if (yPos > 220) { doc.addPage(); yPos = 20; }

    doc.setFontSize(14);
    doc.setTextColor(...emeraldPrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Detalle por Trabajador', 20, yPos);
    yPos += 8;

    // Prepare table body with adjustments
    const tableBody = staffStats.map(s => {
        const row = [
            s.nombre,
            `${s.horas.toFixed(2)} h`,
            s.turnos,
            `${s.promedio.toFixed(2)} h`
        ];

        // Add adjustment column if there are any adjustments
        if (s.ajuste) {
            const adjustText = `${s.ajuste > 0 ? '+' : ''}${s.ajuste.toFixed(2)}h\n(${s.motivoAjuste})`;
            row.push(adjustText);
        } else {
            row.push('-');
        }

        return row;
    });

    // Check if any worker has adjustments
    const hasAdjustments = staffStats.some(s => s.ajuste);

    const tableConfig = {
        startY: yPos,
        head: hasAdjustments
            ? [['Trabajador', 'Horas Finales', 'Turnos', 'Promedio/Turno', 'Ajuste']]
            : [['Trabajador', 'Horas Totales', 'Turnos', 'Promedio/Turno']],
        body: hasAdjustments
            ? tableBody
            : tableBody.map(row => row.slice(0, 4)), // Remove adjustment column if no adjustments
        headStyles: { fillColor: emeraldPrimary },
        margin: { left: 20, right: 20 },
        columnStyles: hasAdjustments ? {
            0: { cellWidth: 50 },
            1: { cellWidth: 35, halign: 'right' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'center', fontSize: 8 }
        } : {
            0: { cellWidth: 60 },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 40, halign: 'right' }
        }
    };

    autoTable(doc, tableConfig);

    yPos = doc.lastAutoTable.finalY + 15;

    // ===== 4. PLANNING DIARIO DEL MES =====
    if (yPos > 220) { doc.addPage(); yPos = 20; }

    doc.setFontSize(14);
    doc.setTextColor(...emeraldPrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Planning Diario del Mes', 20, yPos);
    yPos += 8;

    // Create planning table by worker
    staffStats.forEach((worker, idx) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }

        // Worker name
        doc.setFontSize(11);
        doc.setTextColor(...blackText);
        doc.setFont('helvetica', 'bold');
        doc.text(`${worker.nombre}:`, 20, yPos);
        yPos += 6;

        // Prepare daily schedule
        const dailySchedule = worker.detalles || [];
        if (dailySchedule.length > 0) {
            // Group by weeks for better readability
            const scheduleText = dailySchedule.map(d => {
                const date = format(new Date(d.fecha), 'dd/MM (EEE)', { locale: es });
                const turnoLabel = d.turno === 'M' ? 'Mañana' : d.turno === 'T' ? 'Tarde' : 'Libre';
                return `${date}: ${turnoLabel} (${d.horas}h)`;
            }).join(' | ');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const splitSchedule = doc.splitTextToSize(scheduleText, pageWidth - 40);
            doc.text(splitSchedule, 25, yPos);
            yPos += (splitSchedule.length * 4) + 6;
        } else {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Sin turnos asignados', 25, yPos);
            yPos += 6;
        }
    });

    yPos += 10;

    // ===== 5. INCIDENCIAS Y NOTAS =====
    if (notes && notes.length > 0) {
        if (yPos > 220) { doc.addPage(); yPos = 20; }

        doc.setFontSize(14);
        doc.setTextColor(...emeraldPrimary);
        doc.setFont('helvetica', 'bold');
        doc.text(`4. Incidencias del Mes (${notes.length})`, 20, yPos);
        yPos += 8;

        autoTable(doc, {
            startY: yPos,
            head: [['Fecha', 'Título', 'Descripción', 'Trabajador']],
            body: notes.map(n => [
                format(new Date(n.fecha), 'dd/MM/yyyy'),
                n.titulo,
                n.contenido,
                n.trabajadorRelacionado || '-'
            ]),
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 35 }
            },
            headStyles: { fillColor: grayText },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // ===== FOOTER =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-ES')}`, 20, 285);
        doc.text("Eva's Barcelona - Gestión de RRHH", pageWidth - 20, 285, { align: 'right' });
    }

    // Save
    const fileName = `Informe_Horas_${monthLabel.replace(/ /g, '_')}.pdf`;
    doc.save(fileName);
};
