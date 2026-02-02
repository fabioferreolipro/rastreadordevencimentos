import { Bill, BillStatus, AuditLog } from './types';

/**
 * Serviço de lógica financeira e auditoria aprimorado
 */
export const FinanceService = {
  /**
   * Calcula o número de dias de diferença em relação ao vencimento
   * Retorna positivo para atraso e negativo para antecipação
   */
  calculateDaysDifference(dueDate: string, paymentDate: string): number {
    if (!dueDate || !paymentDate) return 0;
    
    const due = new Date(dueDate + 'T00:00:00');
    const payment = new Date(paymentDate);
    
    if (isNaN(due.getTime()) || isNaN(payment.getTime())) return 0;
    
    due.setHours(0, 0, 0, 0);
    const paymentDay = new Date(payment);
    paymentDay.setHours(0, 0, 0, 0);
    
    const diffTime = paymentDay.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Retorna os dias faltantes para o vencimento
   */
  getDaysUntilDue(dueDate: string): number {
    if (!dueDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    
    if (isNaN(due.getTime())) return 0;
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Retorna o status de vencimento detalhado para UI
   */
  getDueStatus(dueDate: string, isPaid: boolean) {
    if (isPaid) return { text: 'Pago', urgency: 'low', isCritical: false };

    const days = this.getDaysUntilDue(dueDate);
    
    if (days < 0) {
      const absDays = Math.abs(days);
      return { 
        text: `Atrasado há ${absDays} ${absDays === 1 ? 'dia' : 'dias'}`, 
        urgency: 'overdue', 
        isCritical: true 
      };
    }
    
    if (days === 0) {
      return { text: 'Vence hoje', urgency: 'high', isCritical: true };
    }
    
    if (days < 7) {
      return { 
        text: `Faltam ${days} ${days === 1 ? 'dia' : 'dias'}`, 
        urgency: 'high', 
        isCritical: true 
      };
    }
    
    if (days < 15) {
      return { 
        text: `Faltam ${days} dias`, 
        urgency: 'medium', 
        isCritical: false 
      };
    }

    return { 
      text: `Faltam ${days} dias`, 
      urgency: 'low', 
      isCritical: false 
    };
  },

  /**
   * Valida se a data de pagamento é posterior à emissão
   */
  validatePaymentDate(issueDate: string, paymentDate: string): boolean {
    const issue = new Date(issueDate + 'T00:00:00');
    const payment = new Date(paymentDate);
    
    if (isNaN(issue.getTime()) || isNaN(payment.getTime())) return false;
    
    issue.setHours(0, 0, 0, 0);
    const paymentDay = new Date(payment);
    paymentDay.setHours(0, 0, 0, 0);
    
    return paymentDay >= issue;
  },

  /**
   * Valida se o pagamento está sendo feito dentro do prazo (até o vencimento)
   */
  validatePaymentWithinDue(dueDate: string, paymentDate: string): boolean {
    const due = new Date(dueDate + 'T00:00:00');
    const payment = new Date(paymentDate);
    
    if (isNaN(due.getTime()) || isNaN(payment.getTime())) return false;
    
    due.setHours(23, 59, 59, 999); // Final do dia do vencimento
    const paymentDay = new Date(payment);
    paymentDay.setHours(0, 0, 0, 0); // Comparar apenas a data
    
    return paymentDay <= due;
  },

  /**
   * Determina o status detalhado do pagamento
   */
  determineStatus(bill: Partial<Bill>): BillStatus {
    if (!bill.dueDate || !bill.amount) return 'pending';
    
    // Se já foi pago
    if (bill.paymentDate) {
      const daysDiff = this.calculateDaysDifference(bill.dueDate, bill.paymentDate);
      const isPartial = bill.paidAmount && bill.paidAmount < bill.amount;
      
      if (isPartial) return 'paid_partial';
      if (daysDiff < 0) return 'early';
      if (daysDiff === 0) return 'on_time';
      return 'paid';
    }
    
    // Se ainda não foi pago
    const daysUntilDue = this.getDaysUntilDue(bill.dueDate);
    if (daysUntilDue < 0) return 'overdue';
    return 'pending';
  },

  /**
   * Calcula a próxima data de vencimento baseada na frequência
   */
  calculateNextDueDate(currentDueDate: string, frequency: 'weekly' | 'monthly' | 'annual'): string {
    if (!currentDueDate) return new Date().toISOString().split('T')[0];
    
    const date = new Date(currentDueDate + 'T00:00:00');
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  },

  /**
   * Gera um ID de comprovante único
   */
  generateReceiptId(): string {
    return 'REC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  },

  /**
   * Mock para registro de auditoria
   */
  async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    console.log(`[AUDIT] Bill ${log.billId} changed by ${log.userId}: ${log.fieldChanged}. Reason: ${log.reason}`);
  }
};
