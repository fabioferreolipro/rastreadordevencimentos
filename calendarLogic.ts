import { Bill, CalendarViewMode, CalendarEvent } from './types';

/**
 * Lógica auxiliar para o calendário
 */
export const CalendarLogic = {
  /**
   * Filtra eventos para um dia específico com base no modo de visualização
   */
  getEventsForDay: (day: number, month: number, year: number, bills: Bill[], mode: CalendarViewMode): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events: CalendarEvent[] = [];

    bills.forEach(bill => {
      // Verificar data de vencimento
      if ((mode === 'due_date' || mode === 'both') && bill.dueDate === dateStr) {
        events.push({
          bill,
          type: 'due',
          date: bill.dueDate
        });
      }

      // Verificar data de pagamento
      if ((mode === 'payment_date' || mode === 'both') && bill.paymentDate) {
        const paymentDateStr = bill.paymentDate.split('T')[0];
        if (paymentDateStr === dateStr) {
          events.push({
            bill,
            type: 'payment',
            date: paymentDateStr
          });
        }
      }
    });

    return events;
  },

  /**
   * Mantido para compatibilidade se necessário, mas prefira getEventsForDay
   */
  getBillsForDay: (day: number, month: number, year: number, bills: Bill[]) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bills.filter(bill => bill.dueDate === dateStr);
  },

  /**
   * Formata a data para exibição na visão diária
   */
  formatDailyDate: (day: number, month: number, year: number) => {
    return new Date(year, month, day).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }
};
