# Plano de Melhoria e Funcionalidade dos Botões de Ação

Vou transformar os botões estáticos em uma barra de ferramentas funcional e moderna, centralizando o estado das contas no `App.tsx` para garantir que as alterações reflitam em todo o sistema.

## **1. Gestão de Estado Centralizada**
- Mover a lista de contas (`MOCK_BILLS`) para o estado do `App.tsx`.
- Implementar funções globais: `handleUpdateBill`, `handleDeleteBill` e `handlePayBill`.
- Passar essas funções para as visões de Dashboard, Calendário e Histórico.

## **2. Melhoria Visual na Dashboard e Histórico**
- Substituir o ícone de placeholder por um grupo de ações intuitivo:
    - **Pagar** (Ícone `Check`): Botão verde sutil para liquidação rápida de pendências.
    - **Editar** (Ícone `Pencil`): Abre o modal com os dados preenchidos para ajuste.
    - **Excluir** (Ícone `Trash`): Botão vermelho para remoção de registros.
- Aplicar tooltips e efeitos de hover modernos (glassmorphism) para feedback visual imediato.

## **3. Interatividade no Calendário**
- Tornar os botões da **Visão Diária** funcionais:
    - O botão "Editar" abrirá o modal de edição.
    - O botão "Ver Detalhes" (ou Pagar) permitirá a liquidação direta do título.

## **4. Refatoração do Modal de Cadastro**
- Ajustar o `AddBillModal` para detectar automaticamente se está em modo de "Criação" ou "Edição".
- Garantir que o salvamento atualize o estado global corretamente.

## **Próximos Passos**
1. Refatorar o `App.tsx` para gerenciar o estado global.
2. Atualizar a coluna de ações na [DashboardView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/DashboardView.tsx).
3. Implementar a funcionalidade de clique na [CalendarView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/CalendarView.tsx).
4. Sincronizar o [AddBillModal.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/AddBillModal.tsx) com o novo fluxo de dados.
