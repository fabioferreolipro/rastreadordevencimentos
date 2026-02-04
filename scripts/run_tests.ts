import { CalendarTests } from '../calendar.test';
import { PaymentValidationTests } from '../paymentValidation.test';
import { resolveInitialView } from '../App';
import { FinanceService } from '../financeService';
import { PocketBaseService } from '../pocketbaseService';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  console.log('🧪 Iniciando suíte de regressão...');

  assert(resolveInitialView('#calendar', null) === 'calendar', 'resolveInitialView: hash deve vencer');
  assert(resolveInitialView('', 'reports') === 'reports', 'resolveInitialView: saved válido deve ser usado');
  assert(resolveInitialView('#invalido', 'dashboard') === 'dashboard', 'resolveInitialView: fallback para saved');
  assert(resolveInitialView('#invalido', null) === 'login', 'resolveInitialView: fallback para login');

  (PocketBaseService as any).clearAuthState();
  assert(PocketBaseService.getAuthState() === null, 'PocketBaseService: estado deve iniciar nulo');
  (PocketBaseService as any).setAuthState({ token: 'token', record: { id: 'u1', role: 'user' } });
  assert(PocketBaseService.getAuthState()?.record?.id === 'u1', 'PocketBaseService: deve recuperar estado persistido');
  (PocketBaseService as any).clearAuthState();
  assert(PocketBaseService.getAuthState() === null, 'PocketBaseService: clearAuthState deve limpar estado');

  assert(
    FinanceService.calculateDaysDifference('2023-10-30', '2023-10-31T03:00:00.000Z') === 1,
    'FinanceService: diferença de dias deve ser estável com timezone'
  );

  CalendarTests.runTests();
  PaymentValidationTests.runTests();

  console.log('✅ Suíte de regressão finalizada.');
};

run().catch((err) => {
  console.error('❌ Falha na suíte de regressão:', err?.message || err);
  process.exit(1);
});

