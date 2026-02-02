import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Router, Zap, ArrowLeft, Clock, Tag, FileText, AlertTriangle, Check, Pencil, Trash2, RotateCcw, Calendar as CalendarIcon, CreditCard, LayoutGrid } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { MOCK_BILLS } from '../constants';
import { CalendarLogic } from '../calendarLogic';
import { FinanceService } from '../financeService';
import { Bill, Category, CalendarViewMode, CalendarEvent } from '../types';

interface CalendarViewProps {
  bills: Bill[];
  categories: Category[];
  onAddBill: () => void;
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onTogglePayBill: (billId: string) => void;
  onNavigate: (view: any) => void;
  onManageCategories: () => void;
  onLogout?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  bills, 
  categories, 
  onAddBill, 
  onEditBill, 
  onDeleteBill, 
  onTogglePayBill, 
  onNavigate,
  onManageCategories,
  onLogout
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    const saved = localStorage.getItem('calendar_view_mode');
    return (saved as CalendarViewMode) || 'due_date';
  });

  useEffect(() => {
    localStorage.setItem('calendar_view_mode', viewMode);
  }, [viewMode]);

  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentMonth(new Date(year, month, 1));
  };

  const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long' });
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();

  const getEventsForDay = (day: number) => {
    return CalendarLogic.getEventsForDay(day, month, year, bills, viewMode);
  };

  const todayStr = today.toISOString().split('T')[0];
  const billsToday = bills.filter(b => b.dueDate === todayStr);
  const pendingTodayCount = billsToday.filter(b => b.status !== 'paid').length;

  const totalMonth = bills.reduce((acc, b) => acc + b.amount, 0);
  const paidMonth = bills.filter(b => b.status === 'paid').reduce((acc, b) => acc + (b.paidAmount || b.amount), 0);
  const percentComplete = totalMonth > 0 ? Math.round((paidMonth / totalMonth) * 100) : 0;

  const renderMonthlyView = () => (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black capitalize">{monthName} {year}</h3>
          <p className="text-text-muted text-sm">
            {viewMode === 'due_date' && `Visualizando vencimentos (${bills.filter(b => b.status !== 'paid').length} pendentes).`}
            {viewMode === 'payment_date' && `Visualizando pagamentos realizados.`}
            {viewMode === 'both' && `Visualizando vencimentos e pagamentos.`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex items-center bg-surface-dark/60 p-1 rounded-2xl border border-border-dark shadow-inner">
            <button 
              onClick={() => setViewMode('due_date')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'due_date' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <CalendarIcon className="size-3.5" />
              <span>Vencimento</span>
            </button>
            <button 
              onClick={() => setViewMode('payment_date')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'payment_date' ? 'bg-success text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <CreditCard className="size-3.5" />
              <span>Pagamento</span>
            </button>
            <button 
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'both' ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Ambas</span>
            </button>
          </div>

          <div className="h-8 w-px bg-border-dark hidden sm:block"></div>

          <button 
            onClick={onManageCategories}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">category</span>
            <span className="hidden sm:inline">Categorias</span>
          </button>
          
          <MonthYearPicker 
            month={month}
            year={year}
            onChange={handleMonthYearChange}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 glass-panel bg-surface-dark/40 rounded-2xl overflow-hidden flex flex-col border border-border-dark shadow-2xl">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-border-dark bg-surface-dark/20">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">{day}</div>
          ))}
        </div>
        {/* Cells */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-auto custom-scrollbar">
          {/* Empty previous month days */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`prev-${i}`} className="border-r border-b border-border-dark p-2 bg-white/[0.01]"></div>
          ))}
          
          {/* Days */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
             const isToday = today.getDate() === day && 
                            today.getMonth() === month && 
                            today.getFullYear() === year;
             const events = getEventsForDay(day);

             return (
               <div 
                key={day} 
                onClick={() => setSelectedDay(day)}
                className={`border-r border-b border-border-dark p-2 md:p-3 group hover:bg-white/[0.03] transition-colors relative cursor-pointer min-h-[100px] flex flex-col gap-2 ${isToday ? 'bg-primary/5' : ''}`}
               >
                 <div className="flex justify-between items-start">
                   <span className={`text-sm font-bold ${isToday ? 'size-7 flex items-center justify-center bg-primary rounded-xl text-white shadow-lg shadow-primary/30' : 'text-text-muted'}`}>{day}</span>
                   {isToday && <span className="text-[8px] text-primary font-black hidden md:block tracking-widest">HOJE</span>}
                 </div>
                 
                 <div className="space-y-1 overflow-hidden">
                    {events.map((event, idx) => {
                       const cat = categories.find(c => c.id === event.bill.category);
                       const color = cat?.color || '#3b82f6';
                       const isDue = event.type === 'due';
                       
                       return (
                         <div key={idx} className="flex items-center gap-1">
                           <div className={`px-1.5 py-1 text-[9px] font-black rounded-lg truncate border transition-all flex-1 flex items-center gap-1.5`}
                             style={{ 
                               backgroundColor: isDue 
                                 ? (event.bill.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : `${color}20`)
                                 : 'rgba(59, 130, 246, 0.1)',
                               color: isDue 
                                 ? (event.bill.status === 'paid' ? '#22c55e' : color)
                                 : '#3b82f6',
                               borderColor: isDue 
                                 ? (event.bill.status === 'paid' ? 'rgba(34, 197, 94, 0.2)' : `${color}30`)
                                 : 'rgba(59, 130, 246, 0.2)'
                             }}>
                             <span className="material-symbols-outlined text-[12px]">
                               {isDue ? 'event' : 'payments'}
                             </span>
                             <span className="truncate">{event.bill.name}</span>
                           </div>
                         </div>
                       );
                    })}
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );

  const renderDailyView = () => {
     const events = getEventsForDay(selectedDay!);
     const formattedDate = CalendarLogic.formatDailyDate(selectedDay!, month, year);

     return (
      <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-slide-in-right">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedDay(null)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 shadow-sm active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex flex-col">
            <h3 className="text-2xl font-black capitalize tracking-tight">{formattedDate}</h3>
            <p className="text-text-muted text-sm font-medium">
              {events.length === 0 ? 'Nenhum registro para este dia.' : `Existem ${events.length} registros no modo selecionado.`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto pr-2 space-y-4 custom-scrollbar">
          {events.length > 0 ? (
            events.map((event, idx) => {
              const bill = event.bill;
              const isDue = event.type === 'due';
              const dueStatus = FinanceService.getDueStatus(bill.dueDate || '', bill.status === 'paid');
              
              return (
                <div key={`${bill.id}-${event.type}-${idx}`} className="glass-panel p-6 rounded-3xl border border-border-dark hover:border-primary/30 transition-all group relative overflow-hidden">
                  {/* Badge de Tipo de Evento */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${isDue ? 'bg-primary/20 text-primary border-l border-b border-primary/20' : 'bg-success/20 text-success border-l border-b border-success/20'}`}>
                    {isDue ? 'Vencimento' : 'Pagamento Realizado'}
                  </div>

                  <div className="flex justify-between items-start mb-6 pt-2">
                    <div className="flex items-center gap-5">
                      <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg ${isDue ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                        <span className="material-symbols-outlined text-2xl">
                          {isDue ? 'event_note' : 'task_alt'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white group-hover:text-primary transition-colors">{bill.name || 'Sem Nome'}</h4>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold">
                            <Clock className="size-3.5" />
                            <span>09:00 AM</span>
                          </div>
                          
                          {isDue && (
                            <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-tight ${
                              dueStatus.urgency === 'overdue' ? 'text-danger' : 
                              dueStatus.urgency === 'high' ? 'text-warning' : 'text-text-muted'
                            }`}>
                              <AlertTriangle className="size-3.5" />
                              <span>{dueStatus.text}</span>
                            </div>
                          )}

                          {!isDue && bill.paymentDate && (
                            <div className="flex items-center gap-1.5 text-success text-xs font-black uppercase tracking-tight">
                              <Check className="size-3.5" />
                              <span>Liquidado</span>
                            </div>
                          )}

                          {(() => {
                            const cat = categories.find(c => c.id === bill.category);
                            if (!cat) return null;
                            return (
                              <div 
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
                              >
                                <Tag className="size-3" />
                                <span>{cat.name}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-2xl font-black text-white tracking-tighter">R$ {(bill.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
                        bill.status === 'paid' ? 'bg-success/10 text-success border-success/20' : 
                        dueStatus.urgency === 'overdue' ? 'bg-danger/10 text-danger border-danger/20' : 
                        'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {bill.status === 'paid' ? 'Pago' : dueStatus.urgency === 'overdue' ? 'Atrasado' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {bill.notes && (
                    <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-4">
                      <FileText className="size-5 text-text-muted shrink-0 mt-0.5" />
                      <p className="text-sm text-text-muted leading-relaxed font-medium italic">"{bill.notes}"</p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">
                     <button 
                       onClick={() => onTogglePayBill(bill.id)}
                       className={`flex-1 min-w-[140px] py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                         bill.status === 'paid' 
                           ? 'bg-warning/10 hover:bg-warning text-warning hover:text-background-dark border border-warning/20 shadow-warning/10' 
                           : 'bg-success/10 hover:bg-success text-success hover:text-white border border-success/20 shadow-success/10'
                       }`}
                     >
                       {bill.status === 'paid' ? (
                         <>
                           <RotateCcw className="size-4" />
                           Estornar Pagamento
                         </>
                       ) : (
                         <>
                           <Check className="size-4" />
                           Efetuar Pagamento
                         </>
                       )}
                     </button>
                     <button 
                        onClick={() => onEditBill(bill)}
                        className="px-6 py-3.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/10 active:scale-95"
                     >
                       <Pencil className="size-4" />
                       Editar
                     </button>
                     <button 
                        onClick={() => onDeleteBill(bill.id)}
                        className="px-6 py-3.5 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-danger/10 active:scale-95"
                     >
                       <Trash2 className="size-4" />
                       Remover
                     </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-24 rounded-3xl bg-surface-dark/50 border border-border-dark flex items-center justify-center mb-6 shadow-xl">
                <span className="material-symbols-outlined text-5xl text-text-muted opacity-30">event_busy</span>
              </div>
              <h4 className="text-2xl font-black text-white mb-3">Sem registros no filtro atual</h4>
              <p className="text-text-muted max-w-sm mx-auto font-medium">
                {viewMode === 'payment_date' 
                  ? 'Não há pagamentos realizados nesta data.' 
                  : 'Não encontramos nenhuma conta com vencimento nesta data específica.'}
              </p>
              <button 
                onClick={onAddBill}
                className="mt-8 px-8 py-3.5 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 active:scale-95"
              >
                Adicionar Registro
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background-dark text-white font-display">
      <Navbar currentView="calendar" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex flex-col lg:flex-row p-4 lg:p-8 gap-8 overflow-hidden">
          {/* Calendar Section */}
          {selectedDay === null ? renderMonthlyView() : renderDailyView()}

          {/* Right Panel */}
          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6">
            <button 
              onClick={onAddBill}
              className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-2xl shadow-primary/30 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-xl">add_card</span>
              Nova Conta
            </button>

            <div className="flex-1 glass-panel bg-surface-dark/50 rounded-3xl p-6 flex flex-col gap-6 overflow-hidden border border-border-dark shadow-2xl relative">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <span className="material-symbols-outlined text-6xl">account_balance</span>
               </div>

               <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                   <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                     <span className="material-symbols-outlined text-xl">today</span>
                   </div>
                   <h4 className="font-black text-sm uppercase tracking-widest">Resumo do Dia</h4>
                 </div>
                 {pendingTodayCount > 0 && (
                   <span className="bg-danger/20 text-danger text-[9px] px-2.5 py-1 rounded-lg font-black border border-danger/20 animate-pulse uppercase tracking-tighter">{pendingTodayCount} CRÍTICOS</span>
                 )}
               </div>

               <div className="flex-1 overflow-auto space-y-4 custom-scrollbar relative z-10">
                 {billsToday.length > 0 ? billsToday.map((bill) => (
                   <div key={bill.id} onClick={() => onEditBill(bill)} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-white/[0.05] transition-all cursor-pointer group shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-surface-dark flex items-center justify-center text-text-muted border border-border-dark group-hover:text-primary transition-colors">
                               <span className="material-symbols-outlined text-xl">payments</span>
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-black truncate max-w-[120px]">{bill.name}</p>
                               <div className="flex items-center gap-1.5 mt-0.5">
                                 <div className={`size-1.5 rounded-full ${bill.status === 'paid' ? 'bg-success' : 'bg-warning'}`}></div>
                                 <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Vencimento: Hoje</p>
                               </div>
                            </div>
                         </div>
                         <button className="p-1 text-text-muted hover:text-white transition-colors">
                            <MoreVertical className="size-4" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-white">
                            <span className="text-sm font-black tracking-tight">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); onTogglePayBill(bill.id); }}
                           className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                             bill.status === 'paid' 
                               ? 'bg-success text-white' 
                               : 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white'
                           }`}
                         >
                           {bill.status === 'paid' ? 'Pago' : 'Pagar'}
                         </button>
                      </div>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center justify-center py-12 text-text-muted bg-white/[0.01] rounded-3xl border border-dashed border-border-dark/50">
                     <span className="material-symbols-outlined text-4xl mb-3 opacity-10">done_all</span>
                     <p className="text-[10px] font-black uppercase tracking-widest">Tudo em ordem por hoje!</p>
                   </div>
                 )}
               </div>

               <div className="mt-auto pt-6 border-t border-border-dark relative z-10">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-3">
                     <span className="text-text-muted">Mensal</span>
                     <span className="text-white">R$ {totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                     <div 
                       className="bg-primary h-full rounded-full shadow-[0_0_15px_rgba(23,54,207,0.6)] transition-all duration-1000 ease-out" 
                       style={{ width: `${percentComplete}%` }}
                     ></div>
                  </div>
                  <div className="flex justify-between mt-3">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-success uppercase tracking-tighter">R$ {paidMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       <span className="text-[8px] text-text-muted font-bold uppercase">Pagos</span>
                     </div>
                     <div className="flex flex-col items-end text-right">
                       <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{percentComplete}%</span>
                       <span className="text-[8px] text-text-muted font-bold uppercase">Progresso</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
