## **Implementação de Digitação Manual no Seletor de Data**

### **1. Alteração da Estrutura de Componentes**
- Substituirei o elemento `<button>` atual (que serve apenas para abrir o calendário) por um `<input type="text">` no arquivo [DatePicker.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/DatePicker.tsx).
- Manterei todos os estilos de borda, cores, ícones e efeitos de vidro para garantir que a interface continue idêntica.

### **2. Gerenciamento de Estado e Máscara**
- Criarei um estado local para controlar o valor digitado no campo (`DD/MM/YYYY`).
- Implementarei uma função de máscara automática que insere as barras (`/`) conforme o usuário digita os números.
- Sincronizarei o valor digitado com o calendário: ao escolher uma data no calendário, o campo de texto será atualizado automaticamente, e vice-versa.

### **3. Validação de Entrada**
- Adicionarei uma lógica de validação para garantir que a data digitada seja válida (ex: não permitir dia 32 ou mês 13).
- Assim que uma data válida de 10 caracteres (`DD/MM/YYYY`) for detectada, o sistema atualizará automaticamente o estado global da aplicação.

### **4. Comportamento do Calendário**
- O calendário continuará abrindo automaticamente ao clicar no campo ou ao focar nele via teclado.
- O ícone de calendário à esquerda continuará funcionando como um botão para abrir/fechar o seletor.

### **Sub-tarefas**
1. **Refatoração do Trigger**: Trocar `button` por `input` em [DatePicker.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/DatePicker.tsx).
2. **Lógica de Máscara**: Implementar o formatador `DD/MM/YYYY` no `onChange` do input.
3. **Sincronização**: Garantir que a digitação atualize o calendário visual e o estado pai.
