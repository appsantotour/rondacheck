
import type { NonConformity } from '../types';

export const exportToPDF = (data: NonConformity[], title: string) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const tableColumn = ["Data", "Vigia", "Tipo da Falha", "Detalhes"];
    const tableRows: (string | Date)[][] = [];

    data.forEach(item => {
        const rowData = [
            new Date(item.date).toLocaleString('pt-BR'),
            item.guard,
            item.type,
            item.details,
        ];
        tableRows.push(rowData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (data: NonConformity[], title: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
        'Data': new Date(item.date).toLocaleString('pt-BR'),
        'Vigia': item.guard,
        'Tipo da Falha': item.type,
        'Detalhes': item.details,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Não Conformidades");

    // Adjust column widths
    const maxWidths = [20, 15, 40, 60]; 
    worksheet["!cols"] = maxWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};