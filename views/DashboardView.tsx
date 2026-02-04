import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { Bill, Category } from '../types';

import { FinanceService } from '../financeService';
import { AnalyticsService } from '../analyticsService';

interface DashboardViewProps {
  bills: Bill[];
  categories: Category[];
  onAddBill: () => void;
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onTogglePayBill: (billId: string) => void;
  onNavigate: (view: any) => void;
  onManageCategories: () => void;
  onLogout?: () => void;
  syncStatus?: { isSyncing: boolean; error: string | null };
}

type SortConfig = {
  key: keyof Bill | 'dueStatus';
  direction: 'asc' | 'desc';
} | null;

const getCategoryIcon = (name: string) => {
  const lowerName = (name || '').toLowerCase();
  
  let iconName = 'payments';
  if (lowerName.includes('banco') || lowerName.includes('cartão') || lowerName.includes('nubank')) iconName = 'credit_card';
  if (lowerName.includes('luz') || lowerName.includes('energia') || lowerName.includes('eletropaulo')) iconName = 'bolt';
  if (lowerName.includes('internet') || lowerName.includes('wifi') || lowerName.includes('fibra')) iconName = 'wifi';
  if (lowerName.includes('academia') || lowerName.includes('saúde')) iconName = 'fitness_center';
  if (lowerName.includes('seguro')) iconName = 'shield';
  if (lowerName.includes('aluguel') || lowerName.includes('casa')) iconName = 'home';
  if (lowerName.includes('mercado') || lowerName.includes('compra')) iconName = 'shopping_cart';
  
  return <span className="material-symbols-outlined text-sm">{iconName}</span>;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  bills = [], 
  categories = [],
  onAddBill, 
  onEditBill, 
  onDeleteBill, 
  onTogglePayBill, 
  onNavigate,
  onManageCategories,
  onLogout,
  syncStatus
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Garantir que bills seja sempre um array para evitar erros no map/filter
  const safeBills = Array.isArray(bills) ? bills : [];

  const filteredByDateBills = useMemo(() => {
    return safeBills.filter(bill => {
      if (!bill.dueDate) return false;
      const date = new Date(bill.dueDate.slice(0, 10) + 'T12:00:00');
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [safeBills, selectedMonth, selectedYear]);
  
  const sortedBills = useMemo(() => {
    let sortableBills = [...filteredByDateBills];
    if (sortConfig !== null) {
      sortableBills.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'dueStatus') {
          const aStatus = FinanceService.getDueStatus(a.dueDate, a.status === 'paid');
          const bStatus = FinanceService.getDueStatus(b.dueDate, b.status === 'paid');
          
          // Order by urgency level (overdue > high > medium > low)
          const urgencyOrder = { 'overdue': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = urgencyOrder[aStatus.urgency as keyof typeof urgencyOrder] || 0;
          bValue = urgencyOrder[bStatus.urgency as keyof typeof urgencyOrder] || 0;
        } else {
          aValue = a[sortConfig.key as keyof Bill];
          bValue = b[sortConfig.key as keyof Bill];
          
          // Handle undefined values for sorting
          if (aValue === undefined || aValue === null) aValue = '';
          if (bValue === undefined || bValue === null) bValue = '';
          
          // If sorting by numbers, ensure they are treated as such
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBills;
  }, [filteredByDateBills, sortConfig]);

  const requestSort = (key: keyof Bill | 'dueStatus') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const summary = AnalyticsService.generateFinancialSummary(filteredByDateBills);

  const getOverdueAlerts = () => {
    return filteredByDateBills.filter(bill => {
      if (!bill || !bill.dueDate) return false;
      const status = FinanceService.getDueStatus(bill.dueDate, bill.status === 'paid');
      return status.urgency === 'overdue' || (status.isCritical && bill.status !== 'paid');
    });
  };

  const overdueAlerts = getOverdueAlerts();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      // Se já for uma data ISO completa ou tiver timezone, não ajusta a hora
      const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr.slice(0, 10) + 'T12:00:00');
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    } catch (e) {
      return `R$ ${(value || 0).toFixed(2)}`;
    }
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="material-symbols-outlined text-[12px] ml-1 opacity-30">sort</span>;
    }
    return (
      <span className="material-symbols-outlined text-[12px] ml-1 text-primary">
        {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-display">
      <Navbar currentView="dashboard" onNavigate={onNavigate} onLogout={onLogout} syncStatus={syncStatus} />

      <main className="flex-1 px-4 md:px-20 py-8 max-w-[1400px] mx-auto w-full">
        {/* Alertas de Vencimento Crítico */}
        {overdueAlerts.length > 0 && (
          <div className="mb-8 space-y-3">
            {overdueAlerts.map(bill => {
              if (!bill) return null;
              const status = FinanceService.getDueStatus(bill.dueDate, bill.status === 'paid');
              return (
                <div key={bill.id || Math.random()} className={`flex items-center gap-4 p-5 border rounded-2xl animate-pulse shadow-2xl ${
                  status.urgency === 'overdue' ? 'bg-danger/15 border-danger/30' : 'bg-warning/15 border-warning/30'
                }`}>
                  <div className={`size-12 rounded-xl flex items-center justify-center shadow-inner ${
                    status.urgency === 'overdue' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {status.urgency === 'overdue' ? 'error' : 'warning'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-white">{status.text}</p>
                    <p className="text-sm text-text-muted">A conta <span className="text-white font-bold">{bill.name || '---'}</span> requer atenção imediata.</p>
                  </div>
                  <button onClick={() => onEditBill(bill)} className={`px-5 py-2.5 text-white text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 ${
                    status.urgency === 'overdue' ? 'bg-danger hover:bg-danger-hover shadow-danger/20' : 'bg-warning text-background-dark hover:bg-warning-hover shadow-warning/20'
                  }`}>
                    REGULARIZAR AGORA
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Header com Resumo Analítico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-8 rounded-3xl border border-border-dark shadow-xl hover:border-success/30 transition-colors group">
             <div className="flex justify-between items-start mb-4">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Receita Total Paga</p>
                <div className="size-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                   <span className="material-symbols-outlined text-lg">check_circle</span>
                </div>
             </div>
             <h4 className="text-3xl font-black text-white">R$ {(summary?.totalRevenue || 0).toFixed(2)}</h4>
             <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-success w-[70%]" />
             </div>
          </div>
          <div className="glass-panel p-8 rounded-3xl border border-border-dark shadow-xl hover:border-warning/30 transition-colors group">
             <div className="flex justify-between items-start mb-4">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Compromissos Pendentes</p>
                <div className="size-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                   <span className="material-symbols-outlined text-lg">schedule</span>
                </div>
             </div>
             <h4 className="text-3xl font-black text-white">R$ {(summary?.totalPending || 0).toFixed(2)}</h4>
             <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-warning w-[45%]" />
             </div>
          </div>
          <div className="glass-panel p-8 rounded-3xl border border-border-dark shadow-xl hover:border-danger/30 transition-colors group">
             <div className="flex justify-between items-start mb-4">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Total em Atraso</p>
                <div className="size-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger">
                   <span className="material-symbols-outlined text-lg">error</span>
                </div>
             </div>
             <h4 className="text-3xl font-black text-white">R$ {(summary?.totalOverdue || 0).toFixed(2)}</h4>
             <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-danger w-[20%]" />
             </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-6 mb-10">
          <div className="flex min-w-72 flex-col gap-4">
            <h1 className="text-white text-5xl font-black leading-tight tracking-tight">Suas Contas</h1>
            <div className="flex items-center gap-4">
              <MonthYearPicker 
                month={selectedMonth}
                year={selectedYear}
                onChange={handleMonthYearChange}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onManageCategories}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">category</span>
              <span className="hidden sm:inline">Categorias</span>
            </button>
            <button 
              onClick={onAddBill}
              className="flex min-w-[180px] items-center justify-center gap-3 rounded-2xl h-14 px-8 bg-primary text-white text-sm font-black hover:bg-primary-hover transition-all shadow-2xl shadow-primary active:scale-95 group"
            >
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
              <span className="truncate">NOVA CONTA</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-border-dark bg-surface-dark/10 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] backdrop-blur-md border-b border-border-dark">
                  <th 
                    onClick={() => requestSort('name')}
                    className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle cursor-pointer hover:text-white transition-colors w-[20%]"
                  >
                    <div className="flex items-center">Conta {getSortIcon('name')}</div>
                  </th>
                  <th 
                    onClick={() => requestSort('amount')}
                    className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle text-right cursor-pointer hover:text-white transition-colors w-[12%]"
                  >
                    <div className="flex items-center justify-end">Valor {getSortIcon('amount')}</div>
                  </th>
                  <th 
                    onClick={() => requestSort('paymentDate')}
                    className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle cursor-pointer hover:text-white transition-colors w-[14%]"
                  >
                    <div className="flex items-center">Pagamento {getSortIcon('paymentDate')}</div>
                  </th>
                  <th 
                    onClick={() => requestSort('dueDate')}
                    className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle cursor-pointer hover:text-white transition-colors w-[14%]"
                  >
                    <div className="flex items-center">Vencimento {getSortIcon('dueDate')}</div>
                  </th>
                  <th 
                    onClick={() => requestSort('delayDays')}
                    className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle text-center cursor-pointer hover:text-white transition-colors w-[12%]"
                  >
                    <div className="flex items-center justify-center">Dias {getSortIcon('delayDays')}</div>
                  </th>
                  <th 
                    onClick={() => requestSort('status')}
                    className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle text-center cursor-pointer hover:text-white transition-colors w-[12%]"
                  >
                    <div className="flex items-center justify-center">Status {getSortIcon('status')}</div>
                  </th>
                  <th className="px-4 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle text-center w-[16%]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {sortedBills.map((bill, index) => {
                   if (!bill) return null;
                   const dueStatus = FinanceService.getDueStatus(bill.dueDate || '', bill.status === 'paid');
                   const isOverdue = dueStatus.urgency === 'overdue' && bill.status !== 'paid';
                   return (
                    <tr key={bill.id || index} className="hover:bg-white/[0.03] transition-all group relative">
                      <td className="px-4 py-4 whitespace-nowrap align-middle w-[20%]">
                        <div className="flex items-center gap-3">
                           <div className={`size-8 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                             bill.status === 'paid' ? 'bg-success/10 text-success' : 
                             isOverdue ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                           }`}>
                              {getCategoryIcon(bill.name)}
                           </div>
                           <div className="flex flex-col justify-center min-w-0">
                             <span className="text-white text-sm font-bold tracking-tight mb-0.5 group-hover:text-primary transition-colors truncate">{bill.name || 'Sem Nome'}</span>
                             <div className="flex items-center gap-2 mt-0.5">
                               {(() => {
                                 const cat = categories.find(c => c.id === bill.category);
                                 return (
                                   <span 
                                     className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                     style={{ backgroundColor: `${cat?.color || '#64748b'}20`, color: cat?.color || '#64748b', border: `1px solid ${cat?.color || '#64748b'}40` }}
                                   >
                                     {cat?.name || 'Outros'}
                                   </span>
                                 );
                               })()}
                               {bill.isRecurring && (
                                 <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                   <span className="material-symbols-outlined text-[10px]">repeat</span>
                                   {bill.frequency === 'monthly' ? 'Mensal' : bill.frequency === 'weekly' ? 'Semanal' : 'Anual'}
                                 </span>
                               )}
                               <span className="text-text-muted text-[9px] font-medium uppercase tracking-wider truncate">{bill.notes || `Ref #${bill.id ? bill.id.toString().slice(0, 4) : '---'}`}</span>
                             </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap align-middle text-right w-[12%]">
                        <span className="text-white text-sm font-black tracking-tight">
                          {formatCurrency(bill.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap align-middle w-[14%]">
                        <div className="flex flex-col justify-center">
                          {bill.paymentDate ? (
                            <span className="text-success text-xs font-bold">
                              {formatDate(bill.paymentDate)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-text-muted text-[9px] font-bold uppercase tracking-wider">
                              <span className="size-1 rounded-full bg-text-muted/30"></span>
                              Pendente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap align-middle w-[14%]">
                        <div className="flex flex-col justify-center">
                          <span className="text-white text-xs font-bold mb-0.5">
                            {formatDate(bill.dueDate)}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            isOverdue ? 'text-danger animate-pulse' : 
                            dueStatus.urgency === 'high' ? 'text-warning' : 'text-text-muted'
                          }`}>
                            {dueStatus.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap align-middle text-center w-[12%]">
                        {bill.status === 'paid' || bill.paymentDate ? (
                          <div className={`inline-flex items-center justify-center min-w-[50px] px-2 py-1 rounded-lg font-black text-[11px] ${
                            (bill.delayDays || 0) > 0 
                              ? 'bg-danger/10 text-danger border border-danger/20' 
                              : (bill.delayDays || 0) < 0 
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {bill.delayDays && bill.delayDays > 0 ? `+${bill.delayDays}` : bill.delayDays || 0}
                            <span className="ml-1 text-[9px] opacity-70">d</span>
                          </div>
                        ) : (
                          <span className="text-text-muted/30 font-black text-xs">---</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap align-middle text-center w-[12%]">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${
                          bill.status === 'paid' ? 'bg-success/10 text-success border-success/20' : 
                          isOverdue ? 'bg-danger/10 text-danger border-danger/20' : 
                          'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          <div className={`size-1 rounded-full shadow-sm ${
                            bill.status === 'paid' ? 'bg-success' : 
                            isOverdue ? 'bg-danger shadow-danger/50' : 'bg-warning'
                          }`}></div>
                          {bill.status === 'paid' ? 'Pago' : isOverdue ? 'Atraso' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap align-middle w-[16%]">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => onTogglePayBill(bill.id)}
                            className={`p-2 rounded-lg transition-all shadow-md active:scale-90 ${
                              bill.status === 'paid'
                                ? 'bg-warning/10 text-warning hover:bg-warning hover:text-white shadow-warning'
                                : 'bg-success/10 text-success hover:bg-success hover:text-white shadow-success'
                            }`}
                            title={bill.status === 'paid' ? "Estornar Pagamento" : "Confirmar Pagamento"}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {bill.status === 'paid' ? 'undo' : 'check'}
                            </span>
                          </button>
                          <button 
                            onClick={() => onEditBill(bill)}
                            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-md shadow-primary active:scale-90"
                            title="Ajustar Dados"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                          <button 
                            onClick={() => onDeleteBill(bill.id)}
                            className="p-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-all shadow-md shadow-danger active:scale-90"
                            title="Mover para Lixeira"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
          {safeBills.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted">
               <span className="material-symbols-outlined text-5xl mb-4 opacity-20">calendar_today</span>
               <p className="text-sm font-medium">Nenhuma conta registrada para este período.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
