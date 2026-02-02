import { CalendarLogic } from './calendarLogic';
import { Bill } from './types';

const mockBills: Bill[] = [
  { id: '1', name: 'Internet', amount: 100, dueDate: '2023-10-05', status: 'pending', isRecurring: true, delayDays: 0, issueDate: '2023-09-01', userId: '1' },
  { id: '2', name: 'Aluguel', amount: 1500, dueDate: '2023-10-05', status: 'paid', isRecurring: true, delayDays: 0, issueDate: '2023-09-01', userId: '1' },
  { id: '3', name: 'Energia', amount: 200, dueDate: '2023-10-10', status: 'pending', isRecurring: true, delayDays: 0, issueDate: '2023-09-01', userId: '1' },
];

const runTests = () => {
  console.log("🧪 Iniciando testes de lógica do calendário...");
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  // 1. Teste de filtragem por dia
  const day5Bills = CalendarLogic.getBillsForDay(5, 9, 2023, mockBills);
  assert(day5Bills.length === 2, "Deve retornar 2 contas para o dia 05/10/2023");
  assert(day5Bills[0].name === 'Internet', "A primeira conta deve ser 'Internet'");

  const day10Bills = CalendarLogic.getBillsForDay(10, 9, 2023, mockBills);
  assert(day10Bills.length === 1, "Deve retornar 1 conta para o dia 10/10/2023");

  const emptyDayBills = CalendarLogic.getBillsForDay(1, 9, 2023, mockBills);
  assert(emptyDayBills.length === 0, "Deve retornar 0 contas para um dia sem registros");

  // 2. Teste de formatação de data
  const formatted = CalendarLogic.formatDailyDate(5, 9, 2023);
  assert(formatted.includes('quinta-feira') && formatted.includes('5') && formatted.includes('outubro'), 
    "Deve formatar a data corretamente em português");

  console.log(`\n📊 Resultado dos Testes: ${passed} passaram, ${failed} falharam.`);
};

export const CalendarTests = { runTests };
