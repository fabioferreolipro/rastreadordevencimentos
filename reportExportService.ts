import { Bill, Category } from './types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  exportToExcel(bills: Bill[], categories: Category[], fileName: string = 'relatorio-contas.xlsx') {
    const data = bills.map(b => ({
      Vencimento: b.dueDate,
      Nome: b.name,
      Valor: b.amount,
      Status: b.status,
      Recorrente: b.isRecurring ? 'Sim' : 'Não',
      Categoria: this.getCategoryName(b.category, categories)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contas');
    XLSX.writeFile(workbook, fileName);
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
