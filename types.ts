export type ViewState = 'login' | 'dashboard' | 'calendar' | 'reports' | 'trash';

export type BillStatus = 
  | 'paid'          // Pago total
  | 'paid_partial'  // Pago parcialmente
  | 'pending'       // Pendente (ainda não venceu)
  | 'overdue'       // Atrasado (não pago e venceu)
  | 'on_time'       // Pago em dia (status derivado para relatórios)
  | 'early';        // Pago antecipado (status derivado para relatórios)

export type PaymentMethod = 'pix' | 'boleto' | 'cartao_credito' | 'dinheiro' | 'transferencia';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  paidAmount?: number;      // Para pagamentos parciais
  issueDate: string;        // ISO Date string YYYY-MM-DD
  dueDate: string;          // ISO Date string YYYY-MM-DD
  paymentDate?: string;     // ISO Date/Timestamp string com timezone
  paymentMethod?: PaymentMethod;
  exactPaymentTimestamp?: string; // Registro exato do momento do pagamento
  delayDays: number;        // Calculado automaticamente (positivo para atraso, negativo para antecipação)
  status: BillStatus;
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'annual';
  category?: string;        // ID da categoria
  notes?: string;
  userId: string;           // Auditoria: quem criou/possui a conta
  receiptId?: string;       // Identificador único do comprovante
}

export interface AuditLog {
  id: string;
  billId: string;
  userId: string;           // Quem modificou
  timestamp: string;        // Quando modificou
  fieldChanged: string;
  oldValue: string | null;
  newValue: string;
  reason: string;           // Por que modificou (obrigatório)
}

export interface FinancialSummary {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  cashFlowForecast: { date: string; amount: number }[];
  paymentPatterns: {
    averageDaysEarly: number;
    earlyPaymentRate: number; // Porcentagem de pagamentos antecipados
  };
  mrr: number;
  annualProjection: number;
  trends: {
    month: string;
    total: number;
    paid: number;
    pending: number;
  }[];
  categoryDistribution: {
    category: string;
    amount: number;
    count: number;
  }[];
}

export interface DateRangeFilter {
  start: string;
  end: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export type CalendarViewMode = 'due_date' | 'payment_date' | 'both';

export interface CalendarEvent {
  bill: Bill;
  type: 'due' | 'payment';
  date: string;
}
