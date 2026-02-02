import { FinanceService } from './financeService';

/**
 * Suite de testes unitários para o FinanceService
 */
const runTests = () => {
  console.log("🧪 Iniciando testes unitários do FinanceService...");

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

  // 1. Teste de Cálculo de Atraso
  assert(
    FinanceService.calculateDaysDifference('2023-10-01', '2023-10-05T10:00:00') === 4,
    "Deve calcular 4 dias de atraso corretamente."
  );

  assert(
    FinanceService.calculateDaysDifference('2023-10-01', '2023-10-01T23:59:59') === 0,
    "Pagamento no mesmo dia não deve gerar atraso."
  );

  assert(
    FinanceService.calculateDaysDifference('2023-10-10', '2023-10-05T08:00:00') === -5,
    "Pagamento antecipado deve resultar em -5 dias de diferença."
  );

  // 2. Validação de Data de Emissão
  assert(
    FinanceService.validatePaymentDate('2023-10-01', '2023-10-02T12:00:00') === true,
    "Pagamento após emissão deve ser válido."
  );

  assert(
    FinanceService.validatePaymentDate('2023-10-05', '2023-10-01T10:00:00') === false,
    "Pagamento antes da emissão deve ser inválido."
  );

  // 3. Determinação de Status
  assert(
    FinanceService.determineStatus({ dueDate: '2023-10-01', amount: 100, paymentDate: '2023-10-01T10:00:00' }) === 'on_time',
    "Status deve ser 'on_time' para pagamento pontual total."
  );

  assert(
    FinanceService.determineStatus({ dueDate: '2023-10-01', amount: 100, paidAmount: 50, paymentDate: '2023-10-01T10:00:00' }) === 'paid_partial',
    "Status deve ser 'paid_partial' para valor pago inferior ao total."
  );

  console.log(`\n📊 Resultado dos Testes: ${passed} passaram, ${failed} falharam.`);
};

export const FinanceTests = { runTests };
