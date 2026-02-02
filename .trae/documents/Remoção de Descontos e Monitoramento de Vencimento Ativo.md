## **Plano de Remoção de Descontos e Monitoramento de Vencimento**

### **1. Remoção Completa do Sistema de Descontos**
- **Backend e Tipos**: 
    - Remover `discountAmount` de [types.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/types.ts).
    - Excluir `calculateEarlyDiscount` de [financeService.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/financeService.ts).
    - Remover lógica de desconto de [analyticsService.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/analyticsService.ts).
    - Atualizar [setup_schema.js](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/scripts/setup_schema.js) para remover o campo do PocketBase.
- **Interface (UI)**:
    - Remover campos e toggles de desconto de [AddBillModal.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/AddBillModal.tsx).
    - Limpar mensagens promocionais e cards de economia em [DashboardView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/DashboardView.tsx).
- **Testes**: Deletar arquivos de teste de desconto ([earlyPayment.test.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/earlyPayment.test.ts)).

### **2. Novo Sistema de Monitoramento de Vencimento**
- **Lógica**: Implementar função `getDueStatus` no [financeService.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/financeService.ts) para retornar dias restantes e nível de urgência.
- **Componente de Alerta**: Criar um indicador visual que:
    - Exiba "Faltam X dias" ou "Atrasado há X dias".
    - Ative um estado de **Alerta Crítico** (cor laranja/vermelho + ícone) quando faltarem **menos de 7 dias**.
- **Distribuição**: Adicionar o novo indicador em:
    - [DashboardView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/DashboardView.tsx) (Cards de resumo).
    - [CalendarView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/CalendarView.tsx) (Visão diária e lateral).
    - [HistoryView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/HistoryView.tsx) (Tabela de registros).

### **Sub-tarefas**
1. **Cleanup**: Remover todo o código de descontos em um único commit de limpeza.
2. **Status Logic**: Implementar o cálculo de dias restantes.
3. **UI Update**: Inserir os badges de vencimento em todas as visões.
