import { Bill, Category } from './types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const ReportExportService = {
  getCategoryName(categoryId: string | undefined, categories: Category[]) {
    if (!categoryId) return 'Outros';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Outros';
  },

  exportToCSV(bills: Bill[], categories: Category[], fileName: string = 'relatorio-contas.csv') {
    const headers = ['Vencimento', 'Nome', 'Valor', 'Status', 'Recorrente', 'Categoria'];
    const data = bills.map(b => [
      b.dueDate,
      b.name,
      b.amount.toFixed(2),
      b.status,
      b.isRecurring ? 'Sim' : 'Não',
      this.getCategoryName(b.category, categories)
    ]);

    const csvContent = [headers, ...data].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async exportToExcel(bills: Bill[], categories: Category[], fileName: string = 'relatorio-contas.xlsx') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contas');

    worksheet.columns = [
      { header: 'Vencimento', key: 'dueDate', width: 15 },
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Valor', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Recorrente', key: 'isRecurring', width: 15 },
      { header: 'Categoria', key: 'category', width: 20 }
    ];

    bills.forEach(b => {
      worksheet.addRow({
        dueDate: b.dueDate,
        name: b.name,
        amount: b.amount,
        status: b.status,
        isRecurring: b.isRecurring ? 'Sim' : 'Não',
        category: this.getCategoryName(b.category, categories)
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportToPDF(bills: Bill[], categories: Category[], fileName: string = 'relatorio-contas.pdf') {
    const doc = new jsPDF();
    const tableColumn = ['Vencimento', 'Nome', 'Valor', 'Status', 'Categoria'];
    const tableRows = bills.map(b => [
      b.dueDate,
      b.name,
      `R$ ${b.amount.toFixed(2)}`,
      b.status,
      this.getCategoryName(b.category, categories)
    ]);

    doc.text('Relatório de Contas - Finança Pro', 14, 15);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(fileName);
  }
};
