# Plano de Implementação: Função de Recorrência no Modal de Cadastro

Vou tornar visível e configurável a função de contas recorrentes diretamente no modal de criação e edição de dívidas, permitindo que o usuário escolha o ciclo de repetição.

## **1. Atualização da Interface do Modal**
- **Toggle de Recorrência**: Adicionarei um seletor visual (Switch/Toggle) no [AddBillModal.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/AddBillModal.tsx) com o rótulo "Conta Recorrente".
- **Seletor de Frequência**: Implementarei um campo de seleção que aparece apenas quando a recorrência está ativada, oferecendo as opções:
    - **Semanal**
    - **Mensal** (Padrão)
    - **Anual**
- **Feedback Visual**: Utilizarei ícones e cores consistentes com o design atual (glassmorphism) para indicar que a configuração de recorrência está ativa.

## **2. Lógica de Persistência**
- Garantir que ao salvar, os campos `isRecurring` e `frequency` sejam enviados corretamente para a função de salvamento global no `App.tsx`.
- O sistema já possui o motor de autogeração de parcelas, então essa alteração na UI ativará o ciclo automático de faturamento para as novas contas criadas.

## **Próximos Passos**
1. Editar o arquivo [AddBillModal.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/AddBillModal.tsx) para incluir os novos campos no JSX.
2. Ajustar os estilos Tailwind para garantir que os campos de recorrência fiquem bem alinhados e responsivos.
