# Plano de Implementação: Sistema de Lixeira e Refinamento de UI

Vou implementar um sistema de lixeira para recuperação de registros e elevar o nível visual da tabela na dashboard.

## **1. Sistema de Lixeira (Trash System)**

* **Estado Global**: Adicionarei `deletedBills` ao estado do `App.tsx`.

* **Lógica de Exclusão**: Atualizarei `handleDeleteBill` para mover a conta para a lixeira em vez de removê-la permanentemente.

* **Nova Vista** **`TrashView.tsx`**: Criarei uma tela para listar registros excluídos, permitindo:

  * **Restaurar**: Mover de volta para a lista principal.

  * **Esvaziar Lixeira**: Exclusão definitiva de todos os itens.

  * **Exclusão Individual**: Remover permanentemente um item específico.

* **Navegação**: Adicionarei um botão de acesso à lixeira na [Navbar.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/Navbar.tsx).

## **2. Refinamento Visual da Tabela (Dashboard)**

* **Modernização do Layout**:

  * Aplicar bordas arredondadas e sombras mais profundas no container da tabela.

  * Adicionar ícones categoriais (ex: residência, lazer, saúde) baseados no nome da conta.

* **Status Badges Premium**:

  * Substituir os badges simples por versões com gradientes sutis e bordas brilhantes.

  * Incluir um indicador de "pulsar" para contas muito atrasadas.

* **Interatividade**:

  * Efeitos de hover mais pronunciados nas linhas.

  * Tooltips descritivos nos botões de ação.

* **Tipografia**: Ajustar pesos de fonte e cores para melhorar a hierarquia de informação.

## **Próximos Passos**

1. Modificar o [App.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/App.tsx) para gerenciar a lixeira.
2. Criar a [TrashView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/TrashView.tsx).
3. Atualizar a [Navbar.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/Navbar.tsx) para incluir o link da lixeira.
4. Aplicar o "facelift" visual na [DashboardView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/DashboardView.tsx).

