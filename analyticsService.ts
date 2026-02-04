import { Bill, FinancialSummary, Category } from './types';
import { FinanceService } from './financeService';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

/**
 * Serviço de análise financeira e previsões
 */
export const AnalyticsService = {
  /**
   * Gera um resumo financeiro completo baseado nas contas
   */
  generateFinancialSummary(bills: Bill[]): FinancialSummary {
    if (!bills || !Array.isArray(bills)) {
      return {
        totalRevenue: 0,
        totalPending: 0,
        totalOverdue: 0,
        cashFlowForecast: [],
        paymentPatterns: { averageDaysEarly: 0, earlyPaymentRate: 0 },
        mrr: 0,
        annualProjection: 0,
        trends: [],
        categoryDistribution: []
      };
    }

    const paidBills = bills.filter(b => b && (b.status === 'paid' || b.status === 'early' || b.status === 'on_time'));
    const pendingBills = bills.filter(b => b && b.status === 'pending');
    const overdueBills = bills.filter(b => b && b.status === 'overdue');

    // Fluxo de caixa (Previsão de receitas baseada em vencimentos futuros)
    const forecast: { date: string; amount: number }[] = [];
    const forecastMap = new Map<string, number>();

    pendingBills.forEach(bill => {
      if (bill.dueDate) {
        const current = forecastMap.get(bill.dueDate) || 0;
        forecastMap.set(bill.dueDate, current + (bill.amount || 0));
      }
    });

    Array.from(forecastMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, amount]) => forecast.push({ date, amount }));

    // Padrões de pagamento
    const earlyPayments = bills.filter(b => b && b.status === 'early');
    const totalEarlyDays = earlyPayments.reduce((acc, b) => {
      if (b.dueDate && b.paymentDate) {
        return acc + Math.abs(FinanceService.calculateDaysDifference(b.dueDate, b.paymentDate));
      }
      return acc;
    }, 0);

    // Métricas de Receita Recorrente (MRR)
    const recurringBills = bills.filter(b => b && b.isRecurring && b.status !== 'overdue');
    const mrr = recurringBills.reduce((acc, b) => {
      const amount = b.amount || 0;
      if (b.frequency === 'weekly') return acc + (amount * 4);
      if (b.frequency === 'monthly') return acc + amount;
      if (b.frequency === 'annual') return acc + (amount / 12);
      return acc;
    }, 0);

    // Tendências Temporais (Últimos 6 meses)
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'MMM/yy');
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthBills = bills.filter(b => {
        if (!b.dueDate) return false;
        const d = parseISO(b.dueDate);
        return isWithinInterval(d, { start, end });
      });

      trends.push({
        month: monthStr,
        total: monthBills.reduce((acc, b) => acc + (b.amount || 0), 0),
        paid: monthBills.filter(b => b.status === 'paid' || b.status === 'early' || b.status === 'on_time').reduce((acc, b) => acc + (b.paidAmount || b.amount || 0), 0),
        pending: monthBills.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + (b.amount || 0), 0)
      });
    }

    // Distribuição por Categoria
    const categoryMap = new Map<string, { amount: number, count: number }>();
    bills.forEach(b => {
      const cat = b.category || 'sem_categoria';
      const current = categoryMap.get(cat) || { amount: 0, count: 0 };
      categoryMap.set(cat, {
        amount: current.amount + (b.amount || 0),
        count: current.count + 1
      });
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalRevenue: paidBills.reduce((acc, b) => acc + (b.paidAmount || b.amount || 0), 0),
      totalPending: pendingBills.reduce((acc, b) => acc + (b.amount || 0), 0),
      totalOverdue: overdueBills.reduce((acc, b) => acc + (b.amount || 0), 0),
      cashFlowForecast: forecast,
      paymentPatterns: {
        averageDaysEarly: earlyPayments.length > 0 ? totalEarlyDays / earlyPayments.length : 0,
        earlyPaymentRate: bills.length > 0 ? (earlyPayments.length / bills.length) * 100 : 0
      },
      mrr: mrr || 0,
      annualProjection: (mrr || 0) * 12,
      trends,
      categoryDistribution
    };
  }
};
