import { FinanceService } from './financeService';
import { Bill } from './types';

/**
 * Suite de testes para validação de pagamentos no prazo
 */
const runTests = () => {
  console.log("🧪 Iniciando testes de Validação de Pagamento...");

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

  // 1. Validação de Prazo
  assert(
    FinanceService.validatePaymentWithinDue('2023-10-30', '2023-10-20') === true,
    "Pagamento antecipado deve ser considerado dentro do prazo."
  );

  assert(
    FinanceService.validatePaymentWithinDue('2023-10-30', '2023-10-30') === true,
    "Pagamento no dia do vencimento deve ser considerado dentro do prazo."
  );

  assert(
    FinanceService.validatePaymentWithinDue('2023-10-30', '2023-11-01') === false,
    "Pagamento após vencimento deve ser inválido para fluxo 'em dia'."
  );

  // 2. Pagamento Antecipado Integral
  const bill: Partial<Bill> = {
    amount: 1000,
    dueDate: '2023-10-30',
    paymentDate: '2023-10-20',
    paidAmount: 1000
  };

  const status = FinanceService.determineStatus(bill);
  assert(status === 'early', "Status deve ser 'early' para pagamento antes do vencimento.");

  console.log(`\n📊 Resultado dos Testes: ${passed} passaram, ${failed} falharam.`);
};

export const PaymentValidationTests = { runTests };
