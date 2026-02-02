# Plano de Implementação: Contas Recorrentes e Ajustes de Layout

Vou implementar o sistema de recorrência automática para contas e refinar o alinhamento visual da dashboard.

## **1. Sistema de Contas Recorrentes**
- **Lógica de Autogeração**: No `App.tsx`, atualizarei a função `handlePayBill`. Ao marcar uma conta recorrente como paga, o sistema criará automaticamente uma cópia para o próximo período (`semanal`, `mensal` ou `anual`).
- **Cálculo de Datas**: Utilizarei uma nova função auxiliar no `FinanceService` para calcular a próxima data de vencimento com precisão, respeitando feriados e viradas de mês.
- **Interface do Modal**: Garantirei que o [AddBillModal.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/AddBillModal.tsx) salve corretamente as preferências de recorrência.

## **2. Ajuste de Alinhamento na Dashboard**
- **Vertical Centering**: Ajustarei o CSS na [DashboardView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/DashboardView.tsx) para garantir que todos os elementos das linhas da tabela (nome, valor, status e botões) estejam perfeitamente alinhados ao centro verticalmente.
- **Padding e Espaçamento**: Refinarei os paddings das células para uma leitura mais confortável.

## **Próximos Passos**
1. Adicionar lógica de cálculo de data recorrente no `financeService.ts`.
2. Implementar a criação automática de parcelas no `App.tsx`.
3. Ajustar as classes Tailwind da tabela em `DashboardView.tsx`.
